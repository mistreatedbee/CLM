'use server'

import { createAdminClient, createClient } from '@/lib/supabase/server'
import type { ApplicationForm } from '@/components/apply/form-model'

export type SubmitResult =
  | { success: true; ref: string }
  | { success: false; error: string }

export async function submitApplication(form: ApplicationForm): Promise<SubmitResult> {
  try {
    const [supabase, adminSupabase] = await Promise.all([createClient(), createAdminClient()])
    const { data: { user } } = await supabase.auth.getUser()

    const { data, error } = await adminSupabase
      .from('clm_applications')
      .insert({
        full_name: form.fullName,
        id_number: form.idNumber,
        gender: form.gender as 'Male' | 'Female',
        marital_status: form.maritalStatus,
        whatsapp: form.whatsapp,
        phone: form.phone,
        email: null,
        physical_address: form.address,
        country: form.country,
        accepted_christ_date: form.acceptedDate,
        baptized: form.baptized!,
        attends_church: form.attendsChurch!,
        church_name: form.churchName,
        church_denomination: form.denomination,
        pastor_name: form.pastorName,
        serves_ministry: form.servesMinistry!,
        ministry_detail: form.ministryDetail || null,
        reason_joining: form.whyJoin,
        leadership_experience: form.leadershipExperience,
        spiritual_gifts: form.spiritualGifts,
        growth_areas: form.growthAreas,
        called_to_leadership: form.calledToLead!,
        leadership_vision_explanation: form.callingExplanation,
        long_term_vision: form.longTermVision,
        reference_name: form.referenceName,
        reference_phone: form.referencePhone,
        reference_relationship: form.referenceRelationship,
        signature: form.signature,
        signature_date: form.signatureDate,
        applicant_user_id: user?.id ?? null,
        // Only sent when chosen, so membership applications also work before
        // the courses migration has been run. The database sets the course
        // name and fees itself and rejects closed courses.
        ...(/^[0-9a-f-]{36}$/.test(form.courseId ?? '') ? { course_id: form.courseId } : {}),
      })
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
