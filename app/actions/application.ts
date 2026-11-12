'use server'

import { createAdminClient, createClient } from '@/lib/supabase/server'
import { getPublishedForm } from '@/lib/form-config-server'
import {
  answersToRow, applicationsOpen, validateAll, validateFinal,
  type Answers, type Errors, type UploadedDoc,
} from '@/lib/form-config'
import { verifyDocuments } from '@/lib/documents-server'

export type SubmitResult =
  | { success: true; ref: string }
  | { success: false; error: string; fieldErrors?: Errors }

export async function submitApplication(input: {
  courseId: string
  answers: Answers
  draftId?: string
  documents?: UploadedDoc[]
  declarationAccepted?: boolean | null
}): Promise<SubmitResult> {
  try {
    const form = await getPublishedForm()
    if (!applicationsOpen(form)) return { success: false, error: form.settings.closed_message }

    // Validate on the server against the published form, not just in the browser.
    const answers: Answers = input?.answers && typeof input.answers === 'object' ? input.answers : {}
    const requested = form.documents.filter((d) => d.enabled)
    const docs = (Array.isArray(input?.documents) ? input.documents : [])
      .filter((d) => requested.some((r) => r.type === d.type))
      .map((d) => ({ type: String(d.type), path: String(d.path), name: String(d.name ?? '').slice(0, 120), size: Number(d.size) || 0 }))
    const fieldErrors = { ...validateAll(form, answers), ...validateFinal(form, docs, input?.declarationAccepted ?? null) }
    if (Object.keys(fieldErrors).length > 0) {
      return { success: false, error: 'Some answers need attention before you can submit.', fieldErrors }
    }

    const verifiedDocs = await verifyDocuments(String(input?.draftId ?? ''), docs)
    if (!verifiedDocs) {
      return { success: false, error: 'One of your documents could not be found. Please remove it and upload it again.' }
    }

    const { row, custom } = answersToRow(form, answers)
    const [supabase, adminSupabase] = await Promise.all([createClient(), createAdminClient()])
    const { data: { user } } = await supabase.auth.getUser()

    const { data, error } = await adminSupabase
      .from('clm_applications')
      // Columns are built from the form configuration; see lib/form-config.ts.
      .insert({
        ...(row as Record<string, string | boolean | null>),
        email: null,
        applicant_user_id: user?.id ?? null,
        // Only sent when present, so the form also works before the
        // matching migrations have been run.
        ...(Object.keys(custom).length > 0 ? { custom_answers: custom } : {}),
        ...(verifiedDocs.length > 0 ? { documents: verifiedDocs } : {}),
        ...(form.declaration.enabled ? { declaration_accepted: true } : {}),
        ...(/^[0-9a-f-]{36}$/.test(input?.courseId ?? '') ? { course_id: input.courseId } : {}),
      } as never)
      .select('ref')
      .single()

    if (error) {
      console.error('Application submit error:', error)
      if (error.message?.includes('COURSE_CLOSED')) {
        return { success: false, error: 'Sorry, the course you chose is no longer taking applications. Please go back and choose another course or membership only.' }
      }
      return { success: false, error: 'Failed to submit application. Please try again.' }
    }

    return { success: true, ref: data.ref }
  } catch (err) {
    console.error('Unexpected error:', err)
    return { success: false, error: 'Something went wrong. Please try again.' }
  }
}
