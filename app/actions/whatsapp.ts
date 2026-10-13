'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { WhatsAppTemplate, WhatsAppSettings, WhatsAppLog } from '@/lib/supabase/types'
import { getAdmin } from '@/lib/auth'

export type ActionResult = { success: true } | { success: false; error: string }

export async function getWhatsAppTemplates(): Promise<WhatsAppTemplate[]> {
  try {
    if (!(await getAdmin())) return []
    const supabase = await createClient()
    const { data } = await supabase
      .from('whatsapp_templates')
      .select('*')
      .order('trigger_type')
      .order('created_at')
    return data ?? []
  } catch {
    return []
  }
}

export async function saveWhatsAppTemplate(
  template: Partial<WhatsAppTemplate> & { name: string; trigger_type: string; body: string },
): Promise<ActionResult> {
  try {
    if (!(await getAdmin())) return { success: false, error: 'You do not have permission to do that.' }
    const supabase = await createClient()

    if (template.id) {
      const { error } = await supabase
        .from('whatsapp_templates')
        .update({
          name: template.name,
          trigger_type: template.trigger_type,
          body: template.body,
          active: template.active ?? true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', template.id)
      if (error) return { success: false, error: 'Failed to update template.' }
    } else {
      const { error } = await supabase.from('whatsapp_templates').insert({
        name: template.name,
        trigger_type: template.trigger_type,
        body: template.body,
        active: template.active ?? true,
        is_default: false,
      })
      if (error) return { success: false, error: 'Failed to create template.' }
    }

    revalidatePath('/admin/whatsapp')
    return { success: true }
  } catch {
    return { success: false, error: 'Unexpected error.' }
  }
}

export async function deleteWhatsAppTemplate(id: string): Promise<ActionResult> {
  try {
    if (!(await getAdmin())) return { success: false, error: 'You do not have permission to do that.' }
    const supabase = await createClient()
    const { error } = await supabase
      .from('whatsapp_templates')
      .delete()
      .eq('id', id)
      .eq('is_default', false)
    if (error) return { success: false, error: 'Failed to delete template.' }
    revalidatePath('/admin/whatsapp')
    return { success: true }
  } catch {
    return { success: false, error: 'Unexpected error.' }
  }
}

export async function getWhatsAppSettings(): Promise<WhatsAppSettings | null> {
  try {
    if (!(await getAdmin())) return null
    const supabase = await createClient()
    const { data } = await supabase.from('whatsapp_settings').select('*').single()
    return data
  } catch {
    return null
  }
}

export async function saveWhatsAppSettings(
  settings: Omit<WhatsAppSettings, 'id'>,
): Promise<ActionResult> {
  try {
    if (!(await getAdmin())) return { success: false, error: 'You do not have permission to do that.' }
    const supabase = await createClient()
    const { error } = await supabase.from('whatsapp_settings').update(settings).eq('id', 1)
    if (error) return { success: false, error: 'Failed to save settings.' }
    revalidatePath('/admin/whatsapp')
    return { success: true }
  } catch {
    return { success: false, error: 'Unexpected error.' }
  }
}

export async function logWhatsAppMessage(data: {
  applicationId: string
  applicantName: string
  whatsappNumber: string
  templateId: string | null
  templateName: string | null
  messageBody: string
  triggerType: string
  sentBy: string
}): Promise<ActionResult> {
  try {
    if (!(await getAdmin())) return { success: false, error: 'You do not have permission to do that.' }
    const supabase = await createClient()
    const { error } = await supabase.from('whatsapp_logs').insert({
      application_id: data.applicationId,
      applicant_name: data.applicantName,
      whatsapp_number: data.whatsappNumber,
      template_id: data.templateId,
      template_name: data.templateName,
      message_body: data.messageBody,
      trigger_type: data.triggerType,
      sent_by: data.sentBy,
    })
    if (error) return { success: false, error: 'Failed to log message.' }
    return { success: true }
  } catch {
    return { success: false, error: 'Unexpected error.' }
  }
}

export async function getApplicationWaLogs(applicationId: string): Promise<WhatsAppLog[]> {
  try {
    if (!(await getAdmin())) return []
    const supabase = await createClient()
    const { data } = await supabase
      .from('whatsapp_logs')
      .select('*')
      .eq('application_id', applicationId)
      .order('sent_at', { ascending: false })
    return data ?? []
  } catch {
    return []
  }
}
