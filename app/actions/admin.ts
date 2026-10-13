'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { buildWhatsAppUrl, replacePlaceholders } from '@/lib/whatsapp'
import { statusLabel, formatDate } from '@/lib/clm-data'
import type { ApplicationStatus } from '@/lib/supabase/types'
import { getAdmin } from '@/lib/auth'

const STATUSES: ApplicationStatus[] = ['pending', 'under_review', 'approved', 'rejected', 'info_requested']
const NOT_ALLOWED = { success: false as const, error: 'You do not have permission to do that.' }

export type ActionResult =
  | { success: true; whatsappAction?: { url: string; message: string; templateName: string } }
  | { success: false; error: string }

export async function updateApplicationStatus(
  applicationId: string,
  status: ApplicationStatus,
  applicantName: string,
): Promise<ActionResult> {
  try {
    // The service-role client bypasses RLS, so authorise explicitly first.
    if (!(await getAdmin())) return NOT_ALLOWED
    if (!STATUSES.includes(status)) return { success: false, error: 'Invalid status.' }
    // Run as the signed-in admin (RLS allows admins to update) so the
    // audit trigger records who made the decision.
    const adminSupabase = await createClient()

    const { data: current } = await adminSupabase
      .from('clm_applications')
      .select('status')
      .eq('id', applicationId)
      .single()
    if (!current) return { success: false, error: 'Application not found.' }
    // Saving the same status again must not re-trigger notifications.
    if (current.status === status) return { success: true }

    let updatePayload: { status: ApplicationStatus; email?: string } = { status }

    // When approving, ensure email is set so the DB trigger can create the member record
    if (status === 'approved') {
      const { data: app } = await adminSupabase
        .from('clm_applications')
        .select('email, whatsapp, phone')
        .eq('id', applicationId)
        .single()
      if (app && !app.email) {
        updatePayload.email = app.whatsapp ?? app.phone ?? ''
      }
    }

    const { error } = await adminSupabase
      .from('clm_applications')
      .update(updatePayload)
      .eq('id', applicationId)

    if (error) {
      console.error('Status update error:', error)
      return { success: false, error: 'Failed to update status.' }
    }

    revalidatePath('/admin/applications')
    revalidatePath(`/admin/applications/${applicationId}`)
    revalidatePath('/admin')
    revalidatePath('/admin/members')

    // Auto-send WhatsApp if configured
    try {
      const { data: settings } = await adminSupabase
        .from('whatsapp_settings')
        .select('*')
        .single()

      const shouldAutoSend =
        (status === 'approved' && settings?.auto_send_on_approval) ||
        (status === 'rejected' && settings?.auto_send_on_rejection)

      if (shouldAutoSend) {
        const { data: app } = await adminSupabase
          .from('clm_applications')
          .select('whatsapp, phone, created_at')
          .eq('id', applicationId)
          .single()

        const { data: templates } = await adminSupabase
          .from('whatsapp_templates')
          .select('*')
          .eq('trigger_type', status)
          .eq('active', true)
          .limit(1)

        if (templates?.length && app) {
          const template = templates[0]
          const whatsappNumber = app.whatsapp ?? app.phone ?? ''
          const message = replacePlaceholders(template.body, {
            applicantName,
            applicationId,
            applicationStatus: statusLabel(status),
            submissionDate: formatDate(app.created_at),
          })
          const url = buildWhatsAppUrl(whatsappNumber, message)

          await adminSupabase.from('whatsapp_logs').insert({
            application_id: applicationId,
            applicant_name: applicantName,
            whatsapp_number: whatsappNumber,
            template_id: template.id,
            template_name: template.name,
            message_body: message,
            trigger_type: `auto_${status}`,
            sent_by: 'system',
          })

          return { success: true, whatsappAction: { url, message, templateName: template.name } }
        }
      }
    } catch {
      // WhatsApp tables not yet configured — skip silently
    }

    return { success: true }
  } catch {
    return { success: false, error: 'Unexpected error.' }
  }
}

export async function addApplicationNote(
  applicationId: string,
  text: string,
): Promise<ActionResult> {
  try {
    const admin = await getAdmin()
    if (!admin) return NOT_ALLOWED
    const supabase = await createClient()
    const user = admin.user
    if (!text.trim()) return { success: false, error: 'Note is empty.' }

    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .single()

    const { error } = await supabase.from('application_notes').insert({
      application_id: applicationId,
      author_id: user.id,
      author_name: profile?.full_name ?? user.email ?? 'Admin',
      text,
    })

    if (error) {
      console.error('Note insert error:', error)
      return { success: false, error: 'Failed to add note.' }
    }

    revalidatePath(`/admin/applications/${applicationId}`)
    return { success: true }
  } catch {
    return { success: false, error: 'Unexpected error.' }
  }
}

export async function updateAdminNotes(
  applicationId: string,
  notes: string,
): Promise<ActionResult> {
  try {
    if (!(await getAdmin())) return NOT_ALLOWED
    const supabase = await createClient()
    const { error } = await supabase
      .from('clm_applications')
      .update({ admin_notes: notes })
      .eq('id', applicationId)
    if (error) return { success: false, error: 'Failed to save notes.' }
    revalidatePath(`/admin/applications/${applicationId}`)
    return { success: true }
  } catch {
    return { success: false, error: 'Unexpected error.' }
  }
}
