'use client'

import type { ApplicationForm, Errors } from './form-model'
import { RadioCards, SelectField, TextArea, TextField, YesNo } from './form-fields'

type StepProps = {
  form: ApplicationForm
  set: <K extends keyof ApplicationForm>(key: K, value: ApplicationForm[K]) => void
  errors: Errors
}

export function PersonalStep({ form, set, errors }: StepProps) {
  return (
    <div className="flex flex-col gap-7">
      <TextField
        id="fullName"
        label="Full name"
        helper="Enter your name exactly as it appears on your ID."
        example="Grace Mokoena"
        autoComplete="name"
        value={form.fullName}
        onChange={(v) => set('fullName', v)}
        error={errors.fullName}
        required
      />
      <TextField
        id="idNumber"
        label="ID number"
        helper="Your national identity number."
        example="7203125081081"
        inputMode="numeric"
        value={form.idNumber}
        onChange={(v) => set('idNumber', v)}
        error={errors.idNumber}
        required
      />
      <RadioCards
        label="Gender"
        value={form.gender}
        onChange={(v) => set('gender', v)}
        options={['Male', 'Female']}
        error={errors.gender}
        required
      />
      <SelectField
        id="maritalStatus"
        label="Marital status"
        value={form.maritalStatus}
        onChange={(v) => set('maritalStatus', v)}
        options={['Single', 'Married', 'Widowed', 'Divorced']}
        error={errors.maritalStatus}
        required
      />
      <TextField
        id="phone"
        label="Phone number"
        helper="We may call or send you an SMS."
        example="082 445 1290"
        type="tel"
        inputMode="tel"
        autoComplete="tel"
        value={form.phone}
        onChange={(v) => set('phone', v)}
        error={errors.phone}
        required
      />
      <TextField
        id="email"
        label="Email address"
        helper="We will send your confirmation here."
        example="grace@example.com"
        type="email"
        inputMode="email"
        autoComplete="email"
        value={form.email}
        onChange={(v) => set('email', v)}
        error={errors.email}
        required
      />
      <TextArea
        id="address"
        label="Physical address"
        helper="Where do you live? Include your town or city."
        example="14 Church Street, Polokwane"
        rows={3}
        value={form.address}
        onChange={(v) => set('address', v)}
        error={errors.address}
        required
      />
      <TextField
        id="country"
        label="Country"
        example="South Africa"
        autoComplete="country-name"
        value={form.country}
        onChange={(v) => set('country', v)}
        error={errors.country}
        required
      />
    </div>
  )
}

export function SpiritualStep({ form, set, errors }: StepProps) {
  return (
    <div className="flex flex-col gap-7">
      <TextField
        id="acceptedDate"
        label="When did you accept Jesus?"
        helper="A year or a season is fine."
        example="1998 or Easter 2010"
        value={form.acceptedDate}
        onChange={(v) => set('acceptedDate', v)}
        error={errors.acceptedDate}
        required
      />
      <YesNo
        label="Have you been baptized?"
        value={form.baptized}
        onChange={(v) => set('baptized', v)}
        error={errors.baptized}
        required
      />
      <YesNo
        label="Do you attend church?"
        value={form.attendsChurch}
        onChange={(v) => set('attendsChurch', v)}
        error={errors.attendsChurch}
        required
      />
      <TextField
        id="churchName"
        label="Church name"
        example="Grace Family Church"
        value={form.churchName}
        onChange={(v) => set('churchName', v)}
        error={errors.churchName}
        required
      />
      <TextField
        id="denomination"
        label="Denomination"
        example="Pentecostal, Baptist, Methodist..."
        value={form.denomination}
        onChange={(v) => set('denomination', v)}
        error={errors.denomination}
        required
      />
      <TextField
        id="pastorName"
        label="Pastor’s name"
        example="Pastor Samuel Nkosi"
        value={form.pastorName}
        onChange={(v) => set('pastorName', v)}
        error={errors.pastorName}
        required
      />
      <YesNo
        label="Do you serve in a ministry?"
        value={form.servesMinistry}
        onChange={(v) => set('servesMinistry', v)}
        error={errors.servesMinistry}
        required
      />
      {form.servesMinistry && (
        <TextArea
          id="ministryDetail"
          label="Tell us how you serve"
          helper="Which ministry and what do you do?"
          example="I lead the women’s prayer group and help with outreach."
          value={form.ministryDetail}
          onChange={(v) => set('ministryDetail', v)}
          error={errors.ministryDetail}
          required
        />
      )}
    </div>
  )
}

export function LeadershipStep({ form, set, errors }: StepProps) {
  return (
    <div className="flex flex-col gap-7">
      <TextArea
        id="whyJoin"
        label="Why do you want to join CLM?"
        helper="Share what is on your heart. There are no wrong answers."
        rows={5}
        value={form.whyJoin}
        onChange={(v) => set('whyJoin', v)}
        error={errors.whyJoin}
        required
      />
      <TextArea
        id="leadershipExperience"
        label="Your leadership experience"
        helper="Any way you have led or served others."
        rows={5}
        value={form.leadershipExperience}
        onChange={(v) => set('leadershipExperience', v)}
        error={errors.leadershipExperience}
        required
      />
      <TextArea
        id="spiritualGifts"
        label="Your spiritual gifts"
        helper="What are you naturally good at in serving God?"
        rows={4}
        value={form.spiritualGifts}
        onChange={(v) => set('spiritualGifts', v)}
        error={errors.spiritualGifts}
        required
      />
      <TextArea
        id="growthAreas"
        label="Areas you want to grow in"
        helper="What would you like to become better at?"
        rows={4}
        value={form.growthAreas}
        onChange={(v) => set('growthAreas', v)}
        error={errors.growthAreas}
        required
      />
    </div>
  )
}

export function VisionStep({ form, set, errors }: StepProps) {
  return (
    <div className="flex flex-col gap-7">
      <YesNo
        label="Do you believe God has called you into leadership?"
        value={form.calledToLead}
        onChange={(v) => set('calledToLead', v)}
        error={errors.calledToLead}
        required
      />
      <TextArea
        id="callingExplanation"
        label="Please explain your answer"
        helper="Tell us a little about why you chose that answer."
        rows={5}
        value={form.callingExplanation}
        onChange={(v) => set('callingExplanation', v)}
        error={errors.callingExplanation}
        required
      />
      <TextArea
        id="longTermVision"
        label="What is your long-term vision?"
        helper="Where do you hope to be serving in the future?"
        rows={5}
        value={form.longTermVision}
        onChange={(v) => set('longTermVision', v)}
        error={errors.longTermVision}
        required
      />
    </div>
  )
}

export function ReferencesStep({ form, set, errors }: StepProps) {
  return (
    <div className="flex flex-col gap-7">
      <TextField
        id="referenceName"
        label="Church leader’s name"
        helper="Someone who knows you well and can vouch for you."
        example="Pastor Samuel Nkosi"
        value={form.referenceName}
        onChange={(v) => set('referenceName', v)}
        error={errors.referenceName}
        required
      />
      <TextField
        id="referencePhone"
        label="Their phone number"
        example="083 221 5567"
        type="tel"
        inputMode="tel"
        value={form.referencePhone}
        onChange={(v) => set('referencePhone', v)}
        error={errors.referencePhone}
        required
      />
      <TextField
        id="referenceRelationship"
        label="Your relationship to them"
        example="Senior Pastor, Mentor, Elder..."
        value={form.referenceRelationship}
        onChange={(v) => set('referenceRelationship', v)}
        error={errors.referenceRelationship}
        required
      />
      <div className="rounded-2xl border-2 border-dashed border-input bg-muted/40 p-5">
        <TextField
          id="signature"
          label="Digital signature"
          helper="Type your full name to sign this application."
          example="Grace Mokoena"
          value={form.signature}
          onChange={(v) => set('signature', v)}
          error={errors.signature}
          required
        />
        {form.signature && (
          <p className="mt-3 font-[cursive] text-3xl text-primary" aria-hidden="true">
            {form.signature}
          </p>
        )}
      </div>
      <TextField
        id="signatureDate"
        label="Date"
        type="date"
        value={form.signatureDate}
        onChange={(v) => set('signatureDate', v)}
        error={errors.signatureDate}
        required
      />
    </div>
  )
}
