'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient, createClient } from '@/lib/supabase/server'
import type { ApplicationStatus } from '@/lib/supabase/types'

export type ActionResult = { success: true } | { success: false; error: string }

export async function updateApplicationStatus(
  applicationId: string,
  status: ApplicationStatus,
  applicantName: string,
): Promise<ActionResult> {
  try {
    const [supabase, adminSupabase] = await Promise.all([createClient(), createAdminClient()])

    // When approving, the DB trigger creates a member record and requires a non-null email.
    // Since the form no longer collects email, we set it from whatsapp/phone so the trigger succeeds.
    let updatePayload: Record<string, unknown> = { status }
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
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { success: false, error: 'Not authenticated.' }

    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .single()

    const { error } = await supabase
      .from('application_notes')
      .insert({
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
