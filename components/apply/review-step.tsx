'use client'

import { Pencil } from 'lucide-react'
import { isFieldVisible, type Answers, type FormConfig, type StepConfig, type UploadedDoc } from '@/lib/form-config'
import { formatMoney, type PublicCourse } from '@/lib/courses'

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5 border-b border-border/60 py-3 last:border-0 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
      <dt className="text-base font-medium text-muted-foreground sm:w-1/3">{label}</dt>
      <dd className="whitespace-pre-wrap text-lg text-foreground sm:w-2/3 sm:text-right">
        {value?.trim() ? value : '—'}
      </dd>
    </div>
  )
}

function Section({ title, onEdit, children }: { title: string; onEdit: () => void; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="font-heading text-xl font-bold text-foreground">{title}</h3>
        <button
          type="button"
          onClick={onEdit}
          className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-base font-semibold text-primary transition hover:bg-primary/10"
        >
          <Pencil className="size-4" /> Edit
        </button>
      </div>
      <dl>{children}</dl>
    </div>
  )
}

function display(v: string | boolean | null | undefined) {
  if (v === true) return 'Yes'
  if (v === false) return 'No'
  return v ?? ''
}

export function ReviewStep({
  steps,
  answers,
  courseId,
  courses,
  onEdit,
  config,
  docs = [],
  declaration = null,
}: {
  config?: FormConfig
  docs?: UploadedDoc[]
  declaration?: boolean | null
  steps: StepConfig[]
  answers: Answers
  courseId: string
  courses: PublicCourse[]
  onEdit: (stepKey: string) => void
}) {
  const course = courses.find((c) => c.id === courseId)
  return (
    <div className="flex flex-col gap-5">
      <Section title="Course" onEdit={() => onEdit('course')}>
        <Row label="Applying for" value={course ? course.name : 'Membership only (no course)'} />
        {course && (
          <Row
            label="Fees"
            value={
              course.price
                ? `${formatMoney(course.price.total, course.price.currency)} (course ${formatMoney(course.price.course_fee, course.price.currency)} + registration ${formatMoney(course.price.registration_fee, course.price.currency)})`
                : 'To be confirmed'
            }
          />
        )}
      </Section>
      {steps.map((step) => (
        <Section key={step.key} title={step.title} onEdit={() => onEdit(step.key)}>
          {step.fields.filter((f) => isFieldVisible(f, answers)).map((f) => (
            <Row key={f.key} label={f.label} value={display(answers[f.key])} />
          ))}
        </Section>
      ))}
      {config && (config.documents.some((d) => d.enabled) || config.declaration.enabled) && (
        <Section title="Documents" onEdit={() => onEdit('documents')}>
          {config.documents.filter((d) => d.enabled).map((d) => (
            <Row key={d.type} label={d.label} value={docs.find((x) => x.type === d.type)?.name ?? 'Not uploaded'} />
          ))}
          {config.declaration.enabled && <Row label="Declaration" value={declaration ? 'Accepted' : 'Not accepted'} />}
        </Section>
      )}
    </div>
  )
}
