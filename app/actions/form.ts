'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getAdmin } from '@/lib/auth'
import { DEFAULT_FORM_CONFIG, normalizeConfig } from '@/lib/form-config'
import type { Json } from '@/lib/supabase/types'

export type FormResult = { success: true } | { success: false; error: string }

const NOT_ALLOWED: FormResult = { success: false, error: 'Only administrators can change the application form.' }
const NOT_SET_UP: FormResult = {
  success: false,
  error: 'The form editor is not set up yet — run supabase/20261112_application_form_config.sql.',
}

async function fullAdmin() {
  const admin = await getAdmin()
  return admin && admin.role === 'admin' ? admin : null
}

/** Save the draft. The public form doesn't change until it's published. */
export async function saveFormDraft(config: unknown): Promise<FormResult> {
  try {
    const admin = await fullAdmin()
    if (!admin) return NOT_ALLOWED
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('clm_form_config')
      .update({ draft: normalizeConfig(config) as unknown as Json, updated_by: admin.user.id })
      .eq('id', 'form')
      .select('id')
    if (error) { console.error('[form]', error.message); return { success: false, error: 'Could not save. Please try again.' } }
    if (!data?.length) return NOT_SET_UP
    revalidatePath('/admin/form')
    return { success: true }
  } catch {
    return { success: false, error: 'Unexpected error.' }
  }
}

/** Make the draft the live form (or publish the original form if there's no draft yet). */
export async function publishForm(config?: unknown): Promise<FormResult> {
  try {
    const admin = await fullAdmin()
    if (!admin) return NOT_ALLOWED
    const supabase = await createClient()
    const { data: current, error: readErr } = await supabase.from('clm_form_config').select('draft, published').eq('id', 'form').maybeSingle()
    if (readErr || !current) return NOT_SET_UP
    const next = normalizeConfig(config ?? current.draft ?? current.published ?? DEFAULT_FORM_CONFIG)
    const { error } = await supabase
      .from('clm_form_config')
      .update({
        published: next as unknown as Json,
        draft: null,
        published_at: new Date().toISOString(),
        published_by: admin.user.id,
        updated_by: admin.user.id,
      })
      .eq('id', 'form')
    if (error) { console.error('[form]', error.message); return { success: false, error: 'Could not publish. Please try again.' } }
    revalidatePath('/apply')
    revalidatePath('/admin/form')
    return { success: true }
  } catch {
    return { success: false, error: 'Unexpected error.' }
  }
}

export async function discardFormDraft(): Promise<FormResult> {
  try {
    const admin = await fullAdmin()
    if (!admin) return NOT_ALLOWED
    const supabase = await createClient()
    const { error } = await supabase.from('clm_form_config').update({ draft: null, updated_by: admin.user.id }).eq('id', 'form')
    if (error) return { success: false, error: 'Could not discard the draft.' }
    revalidatePath('/admin/form')
    return { success: true }
  } catch {
    return { success: false, error: 'Unexpected error.' }
  }
}
