'use client'

import { Pencil } from 'lucide-react'
import type { ApplicationForm, StepKey } from './form-model'

function yn(v: boolean | null) {
  return v === null ? '—' : v ? 'Yes' : 'No'
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5 border-b border-border/60 py-3 last:border-0 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
      <dt className="text-base font-medium text-muted-foreground sm:w-1/3">{label}</dt>
      <dd className="text-lg text-foreground sm:w-2/3 sm:text-right">
        {value?.trim() ? value : '—'}
      </dd>
    </div>
  )
}

function Section({
  title,
  step,
  onEdit,
  children,
}: {
  title: string
  step: StepKey
  onEdit: (s: StepKey) => void
  children: React.ReactNode
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="font-heading text-xl font-bold text-foreground">{title}</h3>
        <button
          type="button"
          onClick={() => onEdit(step)}
          className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-base font-semibold text-primary transition hover:bg-primary/10"
        >
          <Pencil className="size-4" /> Edit
        </button>
      </div>
      <dl>{children}</dl>
    </div>
  )
}

export function ReviewStep({
  form,
  onEdit,
}: {
  form: ApplicationForm
  onEdit: (s: StepKey) => void
}) {
  return (
    <div className="flex flex-col gap-5">
      <Section title="Personal Information" step="personal" onEdit={onEdit}>
        <Row label="Full name" value={form.fullName} />
        <Row label="ID number" value={form.idNumber} />
        <Row label="Gender" value={form.gender} />
        <Row label="Marital status" value={form.maritalStatus} />
        <Row label="Phone" value={form.phone} />
        <Row label="Email" value={form.email} />
        <Row label="Address" value={form.address} />
        <Row label="Country" value={form.country} />
      </Section>

      <Section title="Spiritual Background" step="spiritual" onEdit={onEdit}>
        <Row label="Accepted Jesus" value={form.acceptedDate} />
        <Row label="Baptized" value={yn(form.baptized)} />
        <Row label="Attends church" value={yn(form.attendsChurch)} />
        <Row label="Church name" value={form.churchName} />
        <Row label="Denomination" value={form.denomination} />
        <Row label="Pastor" value={form.pastorName} />
        <Row label="Serves in ministry" value={yn(form.servesMinistry)} />
        {form.servesMinistry && <Row label="Ministry detail" value={form.ministryDetail} />}
      </Section>

      <Section title="Leadership" step="leadership" onEdit={onEdit}>
        <Row label="Why join CLM" value={form.whyJoin} />
        <Row label="Leadership experience" value={form.leadershipExperience} />
        <Row label="Spiritual gifts" value={form.spiritualGifts} />
        <Row label="Areas of growth" value={form.growthAreas} />
      </Section>

      <Section title="Vision & Calling" step="vision" onEdit={onEdit}>
        <Row label="Called to lead" value={yn(form.calledToLead)} />
        <Row label="Explanation" value={form.callingExplanation} />
        <Row label="Long-term vision" value={form.longTermVision} />
      </Section>

      <Section title="References & Signature" step="references" onEdit={onEdit}>
        <Row label="Reference name" value={form.referenceName} />
        <Row label="Reference phone" value={form.referencePhone} />
        <Row label="Relationship" value={form.referenceRelationship} />
        <Row label="Signature" value={form.signature} />
        <Row label="Date" value={form.signatureDate} />
      </Section>
    </div>
  )
}
