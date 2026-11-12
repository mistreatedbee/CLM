'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowDown, ArrowUp, Eye, Loader2, Lock, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { discardFormDraft, publishForm, saveFormDraft } from '@/app/actions/form'
import {
  CORE_FIELDS, FIELD_TYPES, REQUIRED_STEPS, makeCustomKey,
  type DocumentConfig, type FieldConfig, type FieldType, type FormConfig, type StepConfig,
} from '@/lib/form-config'

const input =
  'h-11 w-full rounded-xl border border-input bg-background px-3 text-base text-foreground outline-none focus:border-ring focus:ring-2 focus:ring-ring/30 disabled:opacity-60'
const area = cn(input, 'h-auto py-2')

function move<T>(list: T[], from: number, to: number) {
  if (to < 0 || to >= list.length) return list
  const next = [...list]
  const [x] = next.splice(from, 1)
  next.splice(to, 0, x)
  return next
}

const toLocal = (iso: string | null) => (iso ? new Date(new Date(iso).getTime() - new Date(iso).getTimezoneOffset() * 60000).toISOString().slice(0, 16) : '')
const fromLocal = (v: string) => (v ? new Date(v).toISOString() : null)

function Field({ label, htmlFor, hint, children, className }: { label: string; htmlFor: string; hint?: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <label htmlFor={htmlFor} className="text-sm font-semibold text-muted-foreground">{label}</label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  )
}

function Check({ checked, onChange, disabled, children }: { checked: boolean; onChange: (v: boolean) => void; disabled?: boolean; children: React.ReactNode }) {
  return (
    <label className={cn('flex items-center gap-2 text-sm', disabled && 'opacity-60')}>
      <input type="checkbox" className="size-4 accent-primary" checked={checked} disabled={disabled} onChange={(e) => onChange(e.target.checked)} />
      {children}
    </label>
  )
}

export function FormEditor({ initial, hasDraft, canEdit }: { initial: FormConfig; hasDraft: boolean; canEdit: boolean }) {
  const router = useRouter()
  const [config, setConfig] = useState(initial)
  const [dirty, setDirty] = useState(false)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [pending, start] = useTransition()

  const update = (fn: (c: FormConfig) => void) => {
    setConfig((prev) => { const next = structuredClone(prev); fn(next); return next })
    setDirty(true)
    setMsg(null)
  }

  function save(after?: () => void) {
    start(async () => {
      const res = await saveFormDraft(config)
      if (!res.success) { setMsg({ ok: false, text: res.error }); return }
      setDirty(false)
      setMsg({ ok: true, text: 'Draft saved. Applicants still see the live form until you publish.' })
      router.refresh()
      after?.()
    })
  }

  function preview() {
    if (!canEdit) { window.open('/admin/form/preview?version=published', '_blank'); return }
    save(() => window.open('/admin/form/preview', '_blank'))
  }

  function publish() {
    if (!window.confirm('Publish this form? Applicants will see the changes straight away.')) return
    start(async () => {
      const res = await publishForm(config)
      if (!res.success) { setMsg({ ok: false, text: res.error }); return }
      setDirty(false)
      setMsg({ ok: true, text: 'Published. The application form now uses these questions.' })
      router.refresh()
    })
  }

  function discard() {
    if (!window.confirm('Discard your unpublished changes?')) return
    start(async () => {
      const res = await discardFormDraft()
      if (!res.success) { setMsg({ ok: false, text: res.error }); return }
      window.location.reload()
    })
  }

  const s = config.settings

  return (
    <div className="space-y-6 pb-24">
      {!canEdit && (
        <p className="rounded-xl bg-muted px-4 py-3 text-sm text-muted-foreground">You can view and preview the form. Only administrators can change it.</p>
      )}
      {msg && (
        <p role={msg.ok ? 'status' : 'alert'} className={cn('rounded-xl px-4 py-3 text-sm font-medium', msg.ok ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive')}>
          {msg.text}
        </p>
      )}

      <fieldset disabled={!canEdit || pending} className="space-y-6">
        <Card className="p-6">
          <h2 className="mb-4 font-heading text-lg font-bold">Opening &amp; closing</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Check checked={s.applications_open} onChange={(v) => update((c) => { c.settings.applications_open = v })}>Accept applications</Check>
            </div>
            <Field label="Opens at" htmlFor="f-open" hint="Blank = open now">
              <input id="f-open" type="datetime-local" className={input} value={toLocal(s.opens_at)} onChange={(e) => update((c) => { c.settings.opens_at = fromLocal(e.target.value) })} />
            </Field>
            <Field label="Closes at" htmlFor="f-close" hint="Blank = no closing date">
              <input id="f-close" type="datetime-local" className={input} value={toLocal(s.closes_at)} onChange={(e) => update((c) => { c.settings.closes_at = fromLocal(e.target.value) })} />
            </Field>
            <Field label="Message shown when closed" htmlFor="f-cm" className="sm:col-span-2">
              <textarea id="f-cm" rows={2} className={area} value={s.closed_message} onChange={(e) => update((c) => { c.settings.closed_message = e.target.value })} />
            </Field>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="mb-4 font-heading text-lg font-bold">Welcome &amp; course step</h2>
          <div className="grid gap-4">
            <Field label="Welcome heading" htmlFor="f-wt">
              <input id="f-wt" className={input} value={config.welcome.title} onChange={(e) => update((c) => { c.welcome.title = e.target.value })} />
            </Field>
            <Field label="Welcome text" htmlFor="f-wi">
              <textarea id="f-wi" rows={2} className={area} value={config.welcome.intro} onChange={(e) => update((c) => { c.welcome.intro = e.target.value })} />
            </Field>
            <Field label="Course step heading" htmlFor="f-ct">
              <input id="f-ct" className={input} value={config.course_step.title} onChange={(e) => update((c) => { c.course_step.title = e.target.value })} />
            </Field>
            <Field label="Course step text" htmlFor="f-ci">
              <textarea id="f-ci" rows={2} className={area} value={config.course_step.intro} onChange={(e) => update((c) => { c.course_step.intro = e.target.value })} />
            </Field>
          </div>
        </Card>

        {config.steps.map((step, si) => (
          <StepEditor key={step.key} step={step} allKeys={config.steps.flatMap((x) => x.fields.map((f) => f.key))}
            onChange={(fn) => update((c) => { fn(c.steps[si]) })} />
        ))}

        <DocumentsEditor
          docs={config.documents}
          intro={config.documents_intro}
          onIntro={(v) => update((c) => { c.documents_intro = v })}
          onChange={(docs) => update((c) => { c.documents = docs })}
        />

        <Card className="p-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-heading text-lg font-bold">Declaration</h2>
            <Check checked={config.declaration.enabled} onChange={(v) => update((c) => { c.declaration.enabled = v })}>Ask applicants to accept a declaration</Check>
          </div>
          <div className={cn('grid gap-4', !config.declaration.enabled && 'opacity-60')}>
            <Field label="Declaration text" htmlFor="d-text">
              <textarea id="d-text" rows={4} className={area} value={config.declaration.text} onChange={(e) => update((c) => { c.declaration.text = e.target.value })} />
            </Field>
            <Field label="Acceptance question" htmlFor="d-acc">
              <input id="d-acc" className={input} value={config.declaration.accept_label} onChange={(e) => update((c) => { c.declaration.accept_label = e.target.value })} />
            </Field>
          </div>
        </Card>
      </fieldset>

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-card/95 px-4 py-3 backdrop-blur lg:left-72">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-end gap-2">
          {dirty && <span className="mr-auto text-sm font-medium text-[color:var(--gold-strong)]">Unsaved changes</span>}
          {canEdit && hasDraft && <Button variant="ghost" onClick={discard} disabled={pending}>Discard draft</Button>}
          <Button variant="outline" onClick={preview} disabled={pending} className="gap-2"><Eye className="size-4" /> Preview</Button>
          {canEdit && (
            <>
              <Button variant="outline" onClick={() => save()} disabled={pending || !dirty} className="gap-2">
                {pending && <Loader2 className="size-4 animate-spin" />} Save draft
              </Button>
              <Button onClick={publish} disabled={pending}>Publish</Button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function StepEditor({ step, allKeys, onChange }: { step: StepConfig; allKeys: string[]; onChange: (fn: (s: StepConfig) => void) => void }) {
  const [label, setLabel] = useState('')
  const [type, setType] = useState<FieldType>('text')
  const required = REQUIRED_STEPS.includes(step.key)

  return (
    <Card className="p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-heading text-lg font-bold">Step: {step.title}</h2>
        <Check checked={step.enabled} disabled={required} onChange={(v) => onChange((s) => { s.enabled = v })}>
          {required ? 'Always shown' : 'Show this step'}
        </Check>
      </div>
      <div className={cn('space-y-4', !step.enabled && 'opacity-60')}>
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="Step heading" htmlFor={`st-${step.key}`}>
            <input id={`st-${step.key}`} className={input} value={step.title} onChange={(e) => onChange((s) => { s.title = e.target.value })} />
          </Field>
          <Field label="Short label (progress bar)" htmlFor={`ss-${step.key}`}>
            <input id={`ss-${step.key}`} className={input} maxLength={40} value={step.short} onChange={(e) => onChange((s) => { s.short = e.target.value })} />
          </Field>
          <Field label="Intro text (optional)" htmlFor={`si-${step.key}`}>
            <input id={`si-${step.key}`} className={input} value={step.intro} onChange={(e) => onChange((s) => { s.intro = e.target.value })} />
          </Field>
        </div>

        <ol className="space-y-3">
          {step.fields.map((field, i) => (
            <QuestionEditor key={field.key} field={field} first={i === 0} last={i === step.fields.length - 1}
              onMove={(d) => onChange((s) => { s.fields = move(s.fields, i, i + d) })}
              onChange={(fn) => onChange((s) => { fn(s.fields[i]) })}
              onRemove={() => onChange((s) => { s.fields.splice(i, 1) })} />
          ))}
        </ol>

        <div className="flex flex-wrap items-end gap-2 rounded-xl border border-dashed border-border p-3">
          <Field label="New question" htmlFor={`nq-${step.key}`} className="min-w-[220px] flex-1">
            <input id={`nq-${step.key}`} className={input} value={label} placeholder="e.g. Which region do you live in?" onChange={(e) => setLabel(e.target.value)} />
          </Field>
          <Field label="Answer type" htmlFor={`nt-${step.key}`}>
            <select id={`nt-${step.key}`} className={input} value={type} onChange={(e) => setType(e.target.value as FieldType)}>
              {FIELD_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </Field>
          <Button type="button" variant="outline" disabled={!label.trim()} className="h-11 gap-1.5"
            onClick={() => {
              const key = makeCustomKey(label, allKeys)
              onChange((s) => {
                s.fields.push({
                  key, type, label: label.trim(), helper: '', placeholder: '', required: false, enabled: true,
                  options: type === 'select' || type === 'radio' ? ['Option 1', 'Option 2'] : [],
                })
              })
              setLabel('')
            }}>
            <Plus className="size-4" /> Add question
          </Button>
        </div>
      </div>
    </Card>
  )
}

function QuestionEditor({ field, first, last, onMove, onChange, onRemove }: {
  field: FieldConfig
  first: boolean
  last: boolean
  onMove: (d: number) => void
  onChange: (fn: (f: FieldConfig) => void) => void
  onRemove: () => void
}) {
  const core = CORE_FIELDS[field.key]
  const id = `q-${field.key}`
  const typeLabel = FIELD_TYPES.find((t) => t.value === field.type)?.label ?? field.type

  return (
    <li className={cn('rounded-xl border border-border p-3', field.enabled ? 'bg-background' : 'bg-muted/40')}>
      <div className="flex flex-wrap items-start gap-3">
        <div className="flex flex-col gap-1">
          <button type="button" aria-label={`Move "${field.label}" up`} disabled={first} className="rounded p-1 hover:bg-muted disabled:opacity-30" onClick={() => onMove(-1)}><ArrowUp className="size-4" /></button>
          <button type="button" aria-label={`Move "${field.label}" down`} disabled={last} className="rounded p-1 hover:bg-muted disabled:opacity-30" onClick={() => onMove(1)}><ArrowDown className="size-4" /></button>
        </div>
        <div className="grid min-w-0 flex-1 gap-3 md:grid-cols-2">
          <Field label="Question" htmlFor={`${id}-l`}>
            <input id={`${id}-l`} className={input} value={field.label} onChange={(e) => onChange((f) => { f.label = e.target.value })} />
          </Field>
          <Field label="Help text" htmlFor={`${id}-h`}>
            <input id={`${id}-h`} className={input} value={field.helper} onChange={(e) => onChange((f) => { f.helper = e.target.value })} />
          </Field>
          {!['yesno', 'radio', 'date', 'select'].includes(field.type) && (
            <Field label="Example answer" htmlFor={`${id}-p`}>
              <input id={`${id}-p`} className={input} value={field.placeholder} onChange={(e) => onChange((f) => { f.placeholder = e.target.value })} />
            </Field>
          )}
          {(field.type === 'select' || field.type === 'radio') && (
            core?.fixedOptions ? (
              <p className="text-xs text-muted-foreground md:col-span-2">Options: {field.options.join(', ')} (fixed)</p>
            ) : (
              <Field label="Options (one per line)" htmlFor={`${id}-o`} className="md:col-span-2">
                <textarea id={`${id}-o`} rows={3} className={area} value={field.options.join('\n')} onChange={(e) => onChange((f) => { f.options = e.target.value.split('\n') })} />
              </Field>
            )
          )}
          {core?.showIf && <p className="text-xs text-muted-foreground md:col-span-2">Only shown when the previous Yes/No answer is “Yes”.</p>}
        </div>
        <div className="flex flex-col gap-2">
          <span className="text-xs text-muted-foreground">{typeLabel}{core ? '' : ' · your question'}</span>
          {core?.locked ? (
            <span className="flex items-center gap-1 text-xs text-muted-foreground"><Lock className="size-3" /> Always required</span>
          ) : (
            <>
              <Check checked={field.enabled} onChange={(v) => onChange((f) => { f.enabled = v })}>Shown</Check>
              <Check checked={field.required} onChange={(v) => onChange((f) => { f.required = v })}>Required</Check>
            </>
          )}
          {!core && (
            <button type="button" onClick={onRemove} className="flex items-center gap-1 rounded px-1 text-sm text-muted-foreground hover:text-destructive">
              <Trash2 className="size-3.5" /> Remove
            </button>
          )}
        </div>
      </div>
    </li>
  )
}

function DocumentsEditor({ docs, intro, onIntro, onChange }: {
  docs: DocumentConfig[]
  intro: string
  onIntro: (v: string) => void
  onChange: (docs: DocumentConfig[]) => void
}) {
  const [label, setLabel] = useState('')
  const set = (i: number, patch: Partial<DocumentConfig>) => onChange(docs.map((d, j) => (j === i ? { ...d, ...patch } : d)))
  return (
    <Card className="p-6">
      <h2 className="mb-1 font-heading text-lg font-bold">Documents to upload</h2>
      <p className="mb-4 text-sm text-muted-foreground">
        Ask applicants for files such as an ID copy or certificates. With none added, the form has no upload step.
      </p>
      <div className="space-y-4">
        <Field label="Instructions" htmlFor="doc-intro">
          <input id="doc-intro" className={input} value={intro} onChange={(e) => onIntro(e.target.value)} />
        </Field>
        <ul className="space-y-3">
          {docs.map((d, i) => (
            <li key={d.type} className="flex flex-wrap items-start gap-3 rounded-xl border border-border p-3">
              <div className="grid min-w-0 flex-1 gap-3 md:grid-cols-2">
                <Field label="Document" htmlFor={`doc-l-${d.type}`}>
                  <input id={`doc-l-${d.type}`} className={input} value={d.label} onChange={(e) => set(i, { label: e.target.value })} />
                </Field>
                <Field label="Hint" htmlFor={`doc-h-${d.type}`}>
                  <input id={`doc-h-${d.type}`} className={input} value={d.hint} onChange={(e) => set(i, { hint: e.target.value })} />
                </Field>
              </div>
              <div className="flex flex-col gap-2">
                <Check checked={d.enabled} onChange={(v) => set(i, { enabled: v })}>Shown</Check>
                <Check checked={d.required} onChange={(v) => set(i, { required: v })}>Required</Check>
                <button type="button" onClick={() => onChange(docs.filter((_, j) => j !== i))} className="flex items-center gap-1 rounded px-1 text-sm text-muted-foreground hover:text-destructive">
                  <Trash2 className="size-3.5" /> Remove
                </button>
              </div>
            </li>
          ))}
        </ul>
        <div className="flex flex-wrap items-end gap-2">
          <Field label="Add a document" htmlFor="doc-new" className="min-w-[220px] flex-1">
            <input id="doc-new" className={input} value={label} placeholder="e.g. Copy of ID" onChange={(e) => setLabel(e.target.value)} />
          </Field>
          <Button type="button" variant="outline" className="h-11 gap-1.5" disabled={!label.trim()}
            onClick={() => {
              const base = label.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '').slice(0, 30) || 'document'
              let type = base
              let n = 2
              while (docs.some((d) => d.type === type) || type.length < 2) type = `${base}_${n++}`
              onChange([...docs, { type, label: label.trim(), hint: '', required: true, enabled: true }])
              setLabel('')
            }}>
            <Plus className="size-4" /> Add
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">Accepted files: PDF, JPG or PNG up to 5 MB each.</p>
      </div>
    </Card>
  )
}
