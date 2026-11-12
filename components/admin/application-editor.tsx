'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Pencil, Save, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { FieldRenderer } from '@/components/apply/field-renderer'
import { CORE_FIELDS, type Answers, type FieldConfig } from '@/lib/form-config'
import { updateApplicationDetails } from '@/app/actions/application-edit'

export interface EditSection {
  title: string
  fields: FieldConfig[]
}

/** Lets an admin correct the answers on a submitted application. */
export function ApplicationEditor({
  applicationId, sections, values,
}: {
  applicationId: string
  sections: EditSection[]
  values: Answers
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState<Answers>(values)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null)
  const [pending, start] = useTransition()

  function save() {
    // Send only what changed, so untouched answers are left exactly as they were.
    const changed = Object.fromEntries(Object.entries(draft).filter(([k, v]) => v !== values[k]))
    if (Object.keys(changed).length === 0) { setMessage({ ok: true, text: 'No changes to save.' }); setOpen(false); return }
    start(async () => {
      const res = await updateApplicationDetails(applicationId, changed)
      if (!res.success) {
        setErrors(res.fieldErrors ?? {})
        setMessage({ ok: false, text: res.error })
        return
      }
      setErrors({})
      setMessage({ ok: true, text: 'Changes saved. The old answers are kept in the edit history below.' })
      setOpen(false)
      router.refresh()
    })
  }

  const notice = message && (
    <p className={message.ok
      ? 'rounded-xl bg-success/10 p-3 text-base text-success'
      : 'rounded-xl bg-destructive/10 p-3 text-base text-destructive'}>
      {message.text}
    </p>
  )

  if (!open) {
    return (
      <div className="flex flex-col gap-3">
        {notice}
        <Button
          variant="outline"
          className="h-11 gap-2 self-start px-4 text-base"
          onClick={() => { setDraft(values); setErrors({}); setMessage(null); setOpen(true) }}
        >
          <Pencil className="size-4" /> Edit application
        </Button>
      </div>
    )
  }

  return (
    <Card className="space-y-8 border-2 border-primary/40 p-6">
      <div>
        <h2 className="font-heading text-xl font-bold text-foreground">Edit application</h2>
        <p className="mt-1 text-base text-muted-foreground">
          Correct the applicant&apos;s answers and press Save. Every change is recorded with the old value.
        </p>
      </div>
      {notice}

      {sections.map((section) => (
        <fieldset key={section.title} className="space-y-5">
          <legend className="mb-3 w-full border-b border-border pb-2 font-heading text-lg font-bold text-foreground">
            {section.title}
          </legend>
          {section.fields.map((f) => {
            const v = draft[f.key] ?? null
            // Keep an old answer selectable even if it's no longer one of the options.
            const options = typeof v === 'string' && v && f.options.length > 0 && !f.options.includes(v)
              ? [...f.options, v] : f.options
            const shown = CORE_FIELDS[f.key]?.showIf
            if (shown && draft[shown.key] !== shown.equals && !values[f.key]) return null
            return (
              <FieldRenderer
                key={f.key}
                field={{ ...f, options, required: !!CORE_FIELDS[f.key]?.locked }}
                value={v}
                error={errors[f.key]}
                onChange={(val) => setDraft((d) => ({ ...d, [f.key]: val }))}
              />
            )
          })}
        </fieldset>
      ))}

      <div className="sticky bottom-4 flex flex-wrap gap-3 rounded-xl border border-border bg-background/95 p-3 shadow-lg backdrop-blur">
        <Button onClick={save} disabled={pending} className="h-11 gap-2 px-5 text-base">
          {pending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />} Save changes
        </Button>
        <Button variant="outline" onClick={() => { setOpen(false); setErrors({}); setMessage(null) }} disabled={pending} className="h-11 gap-2 px-5 text-base">
          <X className="size-4" /> Cancel
        </Button>
      </div>
    </Card>
  )
}
