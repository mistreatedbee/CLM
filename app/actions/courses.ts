'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getAdmin } from '@/lib/auth'
import type { CourseStatus, StudyMode } from '@/lib/supabase/types'

export type CourseActionResult =
  | { success: true; id?: string }
  | { success: false; error: string; errors?: Record<string, string> }

const UUID = /^[0-9a-f-]{36}$/
const MODES: StudyMode[] = ['online', 'in_person', 'blended']
const STATUSES: CourseStatus[] = ['draft', 'active', 'inactive', 'archived']
const NOT_ALLOWED = { success: false as const, error: 'Only administrators can change courses and fees.' }

/** Courses and prices are changed by admins only (reviewers can view). RLS enforces this too. */
async function requireFullAdmin() {
  const admin = await getAdmin()
  return admin && admin.role === 'admin' ? admin : null
}

function refresh() {
  revalidatePath('/')
  revalidatePath('/apply')
  revalidatePath('/admin/courses')
}

function friendly(message: string) {
  if (message.includes('clm_courses_name_unique')) return 'Another course already has that name.'
  if (message.includes('PRICE_IMMUTABLE')) return 'Prices that have taken effect cannot be changed — add a new price instead.'
  if (message.includes('foreign key')) return 'This course has applications, so it can only be archived, not deleted.'
  if (message.includes('row-level security') || message.includes('permission denied')) return NOT_ALLOWED.error
  console.error('[courses]', message)
  return 'Something went wrong. Please try again.'
}

export interface CourseInput {
  id?: string
  name: string
  description: string
  duration: string
  study_mode: string
  status: string
  accepting_applications: boolean
  sort_order: string
}

export async function saveCourse(input: CourseInput): Promise<CourseActionResult> {
  try {
    if (!(await requireFullAdmin())) return NOT_ALLOWED
    const errors: Record<string, string> = {}
    const name = input.name.trim()
    if (name.length < 2 || name.length > 200) errors.name = 'Enter a course name.'
    if (!MODES.includes(input.study_mode as StudyMode)) errors.study_mode = 'Choose a study mode.'
    if (!STATUSES.includes(input.status as CourseStatus)) errors.status = 'Choose a status.'
    const sort = input.sort_order.trim() ? Number(input.sort_order) : 0
    if (!Number.isInteger(sort)) errors.sort_order = 'Use a whole number.'
    if (Object.keys(errors).length) return { success: false, error: 'Please fix the highlighted fields.', errors }

    const row = {
      name,
      description: input.description.trim().slice(0, 5000) || null,
      duration: input.duration.trim().slice(0, 120) || null,
      study_mode: input.study_mode as StudyMode,
      status: input.status as CourseStatus,
      accepting_applications: !!input.accepting_applications,
      sort_order: sort,
    }
    const supabase = await createClient()
    if (input.id) {
      if (!UUID.test(input.id)) return { success: false, error: 'Invalid course.' }
      const { error } = await supabase.from('clm_courses').update(row).eq('id', input.id)
      if (error) return { success: false, error: friendly(error.message) }
      refresh()
      return { success: true, id: input.id }
    }
    const { data, error } = await supabase.from('clm_courses').insert(row).select('id').single()
    if (error) return { success: false, error: friendly(error.message) }
    refresh()
    return { success: true, id: data.id }
  } catch {
    return { success: false, error: 'Unexpected error.' }
  }
}

export interface PriceInput {
  courseId: string
  course_fee: string
  registration_fee: string
  currency: string
  effective_from: string // '' = now; otherwise an ISO date-time
  note: string
}

function amount(v: string, key: string, errors: Record<string, string>) {
  const n = Number(v)
  if (!v.trim() || !Number.isFinite(n) || n < 0 || n > 10_000_000 || Math.round(n * 100) !== n * 100) {
    errors[key] = 'Enter an amount of 0 or more (at most two decimals).'
    return 0
  }
  return n
}

/** Prices are never edited; each change adds a new row so history is kept. */
export async function addCoursePrice(input: PriceInput): Promise<CourseActionResult> {
  try {
    const admin = await requireFullAdmin()
    if (!admin) return NOT_ALLOWED
    if (!UUID.test(input.courseId)) return { success: false, error: 'Invalid course.' }
    const errors: Record<string, string> = {}
    const courseFee = amount(input.course_fee, 'course_fee', errors)
    const registrationFee = amount(input.registration_fee || '0', 'registration_fee', errors)
    const currency = (input.currency || 'ZAR').trim().toUpperCase()
    if (!/^[A-Z]{3}$/.test(currency)) errors.currency = 'Use a 3-letter code, e.g. ZAR.'
    let effective = new Date().toISOString()
    if (input.effective_from) {
      const d = new Date(input.effective_from)
      if (Number.isNaN(d.getTime())) errors.effective_from = 'Enter a valid date and time.'
      else if (d.getTime() < Date.now() - 60_000) errors.effective_from = 'Choose a future time, or leave blank for now.'
      else effective = d.toISOString()
    }
    if (Object.keys(errors).length) return { success: false, error: 'Please fix the highlighted fields.', errors }

    const supabase = await createClient()
    const { error } = await supabase.from('clm_course_prices').insert({
      course_id: input.courseId,
      course_fee: courseFee,
      registration_fee: registrationFee,
      currency,
      effective_from: effective,
      note: input.note.trim().slice(0, 1000) || null,
      created_by: admin.user.id,
    })
    if (error) return { success: false, error: friendly(error.message) }
    refresh()
    return { success: true }
  } catch {
    return { success: false, error: 'Unexpected error.' }
  }
}

export async function deleteScheduledPrice(priceId: string): Promise<CourseActionResult> {
  try {
    if (!(await requireFullAdmin())) return NOT_ALLOWED
    if (!UUID.test(priceId)) return { success: false, error: 'Invalid price.' }
    const supabase = await createClient()
    const { error } = await supabase
      .from('clm_course_prices')
      .delete()
      .eq('id', priceId)
      .gt('effective_from', new Date().toISOString())
    if (error) return { success: false, error: friendly(error.message) }
    refresh()
    return { success: true }
  } catch {
    return { success: false, error: 'Unexpected error.' }
  }
}
