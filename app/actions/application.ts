'use server'

import { createClient } from '@/lib/supabase/server'
import type { ApplicationForm } from '@/components/apply/form-model'

export type SubmitResult =
  | { success: true; ref: string }
  | { success: false; error: string }

export async function submitApplication(form: ApplicationForm): Promise<SubmitResult> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const base = {
      full_name: form.fullName,
      id_number: form.idNumber,
      gender: form.gender as 'Male' | 'Female',
      marital_status: form.maritalStatus,
      phone: form.phone,
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
    }

    // Try with new columns (whatsapp + course) added by migration
    let result = await supabase
      .from('clm_applications')
      .insert({ ...base, whatsapp: form.whatsapp, course: form.course || null })
      .select('ref')
      .single()

    // Migration not run yet — fall back to old schema (store whatsapp in email column)
    if (result.error?.code === '42703') {
      result = await supabase
        .from('clm_applications')
        .insert({ ...base, email: form.whatsapp })
        .select('ref')
        .single()
    }

    if (result.error) {
      console.error('Application submit error:', result.error)
      return { success: false, error: 'Failed to submit application. Please try again.' }
    }

    return { success: true, ref: result.data.ref }
  } catch (err) {
    console.error('Unexpected error:', err)
    return { success: false, error: 'Something went wrong. Please try again.' }
  }
}
