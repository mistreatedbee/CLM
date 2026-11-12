import { createClient } from '@/lib/supabase/server'
import { DEFAULT_FORM_CONFIG, normalizeConfig, type FormConfig } from '@/lib/form-config'

/** The published application form; the original form if none is published (or the migration hasn't run). */
export async function getPublishedForm(): Promise<FormConfig> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase.rpc('get_clm_form')
    if (error || !data) return DEFAULT_FORM_CONFIG
    return normalizeConfig(data)
  } catch {
    return DEFAULT_FORM_CONFIG
  }
}
