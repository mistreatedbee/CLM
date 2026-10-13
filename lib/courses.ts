import type { CourseStatus, StudyMode } from '@/lib/supabase/types'

/** Fees as returned by clm_course_price_quote() — also what is stored on an application. */
export interface PriceQuote {
  price_id: string
  currency: string
  course_fee: number | string
  registration_fee: number | string
  total: number | string
  effective_from: string
  quoted_at: string
}

export interface PublicCourse {
  id: string
  name: string
  description: string | null
  duration: string | null
  study_mode: StudyMode
  open_for_applications: boolean
  price: PriceQuote | null
}

export const STUDY_MODES: { value: StudyMode; label: string }[] = [
  { value: 'online', label: 'Online' },
  { value: 'in_person', label: 'In person' },
  { value: 'blended', label: 'Blended' },
]

export const COURSE_STATUSES: { value: CourseStatus; label: string; hint: string }[] = [
  { value: 'draft', label: 'Draft', hint: 'Not shown to the public' },
  { value: 'active', label: 'Active', hint: 'Shown on the website and application form' },
  { value: 'inactive', label: 'Inactive', hint: 'Temporarily hidden' },
  { value: 'archived', label: 'Archived', hint: 'No longer offered' },
]

export function studyModeLabel(mode: string | null | undefined) {
  return STUDY_MODES.find((m) => m.value === mode)?.label ?? mode ?? ''
}

export function formatMoney(amount: number | string | null | undefined, currency = 'ZAR') {
  if (amount === null || amount === undefined || amount === '') return '—'
  const n = Number(amount)
  if (!Number.isFinite(n)) return '—'
  try {
    return new Intl.NumberFormat('en-ZA', { style: 'currency', currency }).format(n)
  } catch {
    return `${currency} ${n.toFixed(2)}`
  }
}
