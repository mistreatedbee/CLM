'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getAdmin } from '@/lib/auth'
import type { LeadershipLevel, MemberStatus } from '@/lib/supabase/types'

export type MemberResult = { success: true } | { success: false; error: string; errors?: Record<string, string> }

export interface MemberInput {
  full_name: string
  phone: string
  email: string
  id_number: string
  church: string
  leadership_level: string
  status: string
  joined_date: string
  notes: string
}

const UUID = /^[0-9a-f-]{36}$/
const LEVELS: LeadershipLevel[] = ['Trainee', 'Deacon', 'Elder', 'Leader']
const STATUSES: MemberStatus[] = ['active', 'inactive', 'suspended']
const NOT_ALLOWED = { success: false as const, error: 'You do not have permission to manage members.' }

function validate(input: MemberInput) {
  const errors: Record<string, string> = {}
  const full_name = input.full_name.trim()
  if (full_name.length < 2 || full_name.length > 200) errors.full_name = 'Enter the member’s full name.'
  const phone = input.phone.trim()
  if (phone.replace(/\D/g, '').length < 9 || phone.length > 30) errors.phone = 'Enter a valid phone number.'
  const email = input.email.trim().toLowerCase()
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) errors.email = 'Enter a valid email address.'
  const church = input.church.trim()
  if (!church) errors.church = 'Enter the member’s church.'
  if (!LEVELS.includes(input.leadership_level as LeadershipLevel)) errors.leadership_level = 'Choose a level.'
  if (!STATUSES.includes(input.status as MemberStatus)) errors.status = 'Choose a status.'
  if (input.joined_date && !/^\d{4}-\d{2}-\d{2}$/.test(input.joined_date)) errors.joined_date = 'Enter a valid date.'
  if (input.notes.length > 5000) errors.notes = 'Notes must be under 5000 characters.'
  return {
    errors,
    row: {
      full_name,
      phone,
      email: email || null,
      id_number: input.id_number.trim().slice(0, 30) || null,
      church: church.slice(0, 200),
      leadership_level: input.leadership_level as LeadershipLevel,
      status: input.status as MemberStatus,
      notes: input.notes.trim() || null,
      ...(input.joined_date ? { joined_date: input.joined_date } : {}),
    },
  }
}

function friendly(message: string) {
  if (message.includes('row-level security') || message.includes('permission denied')) return NOT_ALLOWED.error
  if (message.includes('notes')) return 'Some fields are not available yet — run supabase/20261023_site_content_and_members.sql.'
  console.error('[members]', message)
  return 'Something went wrong. Please try again.'
}

function refresh() {
  revalidatePath('/admin/members')
  revalidatePath('/admin')
}

/** Add a member who didn't come through the online application. A member number is assigned automatically. */
export async function addMember(input: MemberInput): Promise<MemberResult> {
  try {
    if (!(await getAdmin())) return NOT_ALLOWED
    const { errors, row } = validate(input)
    if (Object.keys(errors).length) return { success: false, error: 'Please fix the highlighted fields.', errors }
    const supabase = await createClient()
    const { error } = await supabase.from('members').insert(row)
    if (error) return { success: false, error: friendly(error.message) }
    refresh()
    return { success: true }
  } catch {
    return { success: false, error: 'Unexpected error.' }
  }
}

export async function updateMember(id: string, input: MemberInput): Promise<MemberResult> {
  try {
    if (!(await getAdmin())) return NOT_ALLOWED
    if (!UUID.test(id)) return { success: false, error: 'Invalid member.' }
    const { errors, row } = validate(input)
    if (Object.keys(errors).length) return { success: false, error: 'Please fix the highlighted fields.', errors }
    const supabase = await createClient()
    const { data, error } = await supabase.from('members').update(row).eq('id', id).select('id')
    if (error) return { success: false, error: friendly(error.message) }
    if (!data?.length) return { success: false, error: 'Member not found.' }
    refresh()
    return { success: true }
  } catch {
    return { success: false, error: 'Unexpected error.' }
  }
}

/** Only members added by hand can be removed; approved applicants are kept (set them inactive instead). */
export async function removeMember(id: string): Promise<MemberResult> {
  try {
    if (!(await getAdmin())) return NOT_ALLOWED
    if (!UUID.test(id)) return { success: false, error: 'Invalid member.' }
    const supabase = await createClient()
    const { data, error } = await supabase.from('members').delete().eq('id', id).is('application_id', null).select('id')
    if (error) return { success: false, error: friendly(error.message) }
    if (!data?.length) {
      return { success: false, error: 'Members who joined through an application can’t be deleted. Set them to Inactive instead.' }
    }
    refresh()
    return { success: true }
  } catch {
    return { success: false, error: 'Unexpected error.' }
  }
}
