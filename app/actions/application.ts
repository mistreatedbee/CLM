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

    const { data, error } = await supabase
      .from('clm_applications')
      .insert({
        full_name: form.fullName,
        id_number: form.idNumber,
        gender: form.gender as 'Male' | 'Female',
        marital_status: form.maritalStatus,
        // whatsapp stored in phone field; home number appended after a separator
        phone: form.whatsapp,
        // store home/landline number + course in admin_notes until migration runs
        admin_notes: [
          form.phone ? `Home/Phone: ${form.phone}` : '',
          form.course ? `Course: ${form.course}` : '',
        ].filter(Boolean).join('\n') || null,
        email: form.whatsapp, // email is NOT NULL in current schema — store whatsapp here
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
      })
      .select('ref')
      .single()

    if (error) {
      console.error('Application submit error:', error)
      return { success: false, error: `Submit failed: ${error.message} [${error.code}]` }
    }

    return { success: true, ref: data.ref }
  } catch (err) {
    console.error('Unexpected error:', err)
    return { success: false, error: 'Something went wrong. Please try again.' }
  }
}
