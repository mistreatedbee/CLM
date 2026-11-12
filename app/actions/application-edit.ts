'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getAdmin } from '@/lib/auth'
import { getPublishedForm } from '@/lib/form-config-server'
import { CORE_FIELDS, validateField, type FieldConfig } from '@/lib/form-config'

export type EditResult =
  | { success: true; changed: number }
  | { success: false; error: string; fieldErrors?: Record<string, string> }

const UUID = /^[0-9a-f-]{36}$/

/**
 * Admin correction of a submitted application. Only the answers that
 * changed are sent. Each is checked against the question's type and
 * options; the questions that must always be answered (name, ID number,
 * phone, church, signature and date) can't be cleared. Runs as the
 * signed-in admin so the database records who changed what.
 */
export async function updateApplicationDetails(
  id: string,
  values: Record<string, string | boolean | null>,
): Promise<EditResult> {
  try {
    if (!(await getAdmin())) return { success: false, error: 'You do not have permission to do that.' }
    if (!UUID.test(id) || !values || typeof values !== 'object') return { success: false, error: 'Invalid request.' }

    const supabase = await createClient()
    const [{ data: app }, form] = await Promise.all([
      supabase.from('clm_applications').select('*').eq('id', id).single(),
      getPublishedForm(),
    ])
    if (!app) return { success: false, error: 'Application not found.' }
    const current = app as unknown as Record<string, unknown>
    const custom = { ...((current.custom_answers ?? {}) as Record<string, unknown>) }

    const fields = new Map<string, FieldConfig>(form.steps.flatMap((s) => s.fields).map((f) => [f.key, f]))
    const patch: Record<string, unknown> = {}
    const fieldErrors: Record<string, string> = {}
    let customChanged = false

    for (const [key, raw] of Object.entries(values)) {
      const field = fields.get(key)
      if (!field) continue
      const core = CORE_FIELDS[key]
      const before = core ? current[core.column] : custom[key]
      const value = typeof raw === 'string' ? raw.trim() : typeof raw === 'boolean' ? raw : null
      // An old answer that's no longer one of the options can be kept as it is.
      const options = typeof before === 'string' && before && !field.options.includes(before)
        ? [...field.options, before] : field.options
      const err = validateField({ ...field, options, required: !!core?.locked }, value)
      if (err) { fieldErrors[key] = err; continue }
      const stored = value === '' ? null : value
      if (core) patch[core.column] = stored
      else { custom[key] = stored; customChanged = true }
    }

    if (Object.keys(fieldErrors).length > 0) {
      return { success: false, error: 'Some answers need attention. Please check the highlighted questions.', fieldErrors }
    }
    if (customChanged) patch.custom_answers = custom
    if (Object.keys(patch).length === 0) return { success: true, changed: 0 }

    const { error } = await supabase.from('clm_applications').update(patch as never).eq('id', id)
    if (error) {
      console.error('Application edit error:', error)
      return { success: false, error: 'Could not save the changes. Please try again.' }
    }

    revalidatePath(`/admin/applications/${id}`)
    revalidatePath('/admin/applications')
    revalidatePath('/admin')
    return { success: true, changed: Object.keys(values).length }
  } catch (err) {
    console.error('Unexpected error:', err)
    return { success: false, error: 'Something went wrong. Please try again.' }
  }
}
