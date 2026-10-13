'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronDown, ChevronUp, Loader2, Pencil, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { addCoursePrice, deleteScheduledPrice, saveCourse, type CourseInput } from '@/app/actions/courses'
import { COURSE_STATUSES, STUDY_MODES, formatMoney, studyModeLabel } from '@/lib/courses'
import type { ClmCourse, ClmCoursePrice } from '@/lib/supabase/types'

export type CourseWithPrices = ClmCourse & { prices: ClmCoursePrice[]; application_count: number }

const input =
  'h-11 w-full rounded-xl border border-input bg-background px-3 text-base text-foreground outline-none focus:border-ring focus:ring-2 focus:ring-ring/30 disabled:opacity-60'

const STATUS_STYLE: Record<string, string> = {
  active: 'bg-success/15 text-success',
  draft: 'bg-muted text-muted-foreground',
  inactive: 'bg-gold/15 text-[color:var(--gold-strong)]',
  archived: 'bg-secondary text-foreground',
}

type Msg = { ok: boolean; text: string } | null

function currentPrice(prices: ClmCoursePrice[], now = Date.now()) {
  return prices.find((p) => new Date(p.effective_from).getTime() <= now) ?? null
}

function Field({ label, htmlFor, error, hint, children, className }: {
  label: string; htmlFor: string; error?: string; hint?: string; children: React.ReactNode; className?: string
}) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <label htmlFor={htmlFor} className="text-sm font-semibold text-muted-foreground">{label}</label>
      {children}
      {error ? <p role="alert" className="text-sm text-destructive">{error}</p> : hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  )
}

function Notice({ msg }: { msg: Msg }) {
  if (!msg) return null
  return (
    <p role={msg.ok ? 'status' : 'alert'} className={cn('rounded-xl px-4 py-3 text-sm font-medium', msg.ok ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive')}>
      {msg.text}
    </p>
  )
}

const BLANK: CourseInput = {
  name: '', description: '', duration: '', study_mode: 'online', status: 'draft', accepting_applications: true, sort_order: '0',
}

function CourseForm({ initial, onDone }: { initial: CourseInput; onDone: (msg: string) => void }) {
  const router = useRouter()
  const [form, setForm] = useState(initial)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [msg, setMsg] = useState<Msg>(null)
  const [pending, start] = useTransition()
  const set = <K extends keyof CourseInput>(k: K, v: CourseInput[K]) => setForm((f) => ({ ...f, [k]: v }))
  const id = initial.id ?? 'new'

  function submit(e: React.FormEvent) {
    e.preventDefault()
    start(async () => {
      const res = await saveCourse(form)
      if (!res.success) { setErrors(res.errors ?? {}); setMsg({ ok: false, text: res.error }); return }
      router.refresh()
      onDone(initial.id ? 'Course saved.' : 'Course created. Add its fees below, then set it to Active.')
    })
  }

  return (
    <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2" noValidate>
      <div className="sm:col-span-2"><Notice msg={msg} /></div>
      <Field label="Course name" htmlFor={`n-${id}`} error={errors.name} className="sm:col-span-2">
        <input id={`n-${id}`} className={input} value={form.name} onChange={(e) => set('name', e.target.value)} maxLength={200} />
      </Field>
      <Field label="Duration" htmlFor={`d-${id}`} hint="e.g. 6 months">
        <input id={`d-${id}`} className={input} value={form.duration} onChange={(e) => set('duration', e.target.value)} maxLength={120} />
      </Field>
      <Field label="Study mode" htmlFor={`m-${id}`} error={errors.study_mode}>
        <select id={`m-${id}`} className={input} value={form.study_mode} onChange={(e) => set('study_mode', e.target.value)}>
          {STUDY_MODES.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
        </select>
      </Field>
      <Field label="Status" htmlFor={`s-${id}`} error={errors.status} hint={COURSE_STATUSES.find((s) => s.value === form.status)?.hint}>
        <select id={`s-${id}`} className={input} value={form.status} onChange={(e) => set('status', e.target.value)}>
          {COURSE_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
      </Field>
      <Field label="Display order" htmlFor={`o-${id}`} error={errors.sort_order} hint="Lower numbers show first">
        <input id={`o-${id}`} type="number" step="1" className={input} value={form.sort_order} onChange={(e) => set('sort_order', e.target.value)} />
      </Field>
      <Field label="Description (optional)" htmlFor={`desc-${id}`} className="sm:col-span-2">
        <textarea id={`desc-${id}`} rows={3} className={cn(input, 'h-auto py-2')} value={form.description} onChange={(e) => set('description', e.target.value)} maxLength={5000} />
      </Field>
      <label className="flex items-center gap-2 text-base sm:col-span-2">
        <input type="checkbox" className="size-4 accent-primary" checked={form.accepting_applications} onChange={(e) => set('accepting_applications', e.target.checked)} />
        Open for new applications
      </label>
      <div className="flex gap-2 sm:col-span-2">
        <Button type="submit" disabled={pending} className="gap-2">
          {pending && <Loader2 className="size-4 animate-spin" />} {initial.id ? 'Save course' : 'Create course'}
        </Button>
        <Button type="button" variant="outline" onClick={() => onDone('')} disabled={pending}>Cancel</Button>
      </div>
    </form>
  )
}

function PriceForm({ course, onDone }: { course: CourseWithPrices; onDone: (msg: string) => void }) {
  const router = useRouter()
  const cur = currentPrice(course.prices)
  const [form, setForm] = useState({
    course_fee: cur ? String(Number(cur.course_fee)) : '',
    registration_fee: cur ? String(Number(cur.registration_fee)) : '',
    currency: cur?.currency ?? 'ZAR',
    effective_from: '',
    note: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [msg, setMsg] = useState<Msg>(null)
  const [pending, start] = useTransition()

  function submit(e: React.FormEvent) {
    e.preventDefault()
    start(async () => {
      const res = await addCoursePrice({
        courseId: course.id,
        ...form,
        // datetime-local is in the admin's own timezone; send UTC.
        effective_from: form.effective_from ? new Date(form.effective_from).toISOString() : '',
      })
      if (!res.success) { setErrors(res.errors ?? {}); setMsg({ ok: false, text: res.error }); return }
      router.refresh()
      onDone(form.effective_from ? 'New price scheduled.' : 'New price is live. Existing applications keep the fees they were quoted.')
    })
  }

  return (
    <form onSubmit={submit} className="grid gap-4 rounded-2xl border border-border bg-muted/30 p-4 sm:grid-cols-3" noValidate>
      <div className="sm:col-span-3"><Notice msg={msg} /></div>
      <Field label={`Course fee (${form.currency})`} htmlFor={`cf-${course.id}`} error={errors.course_fee}>
        <input id={`cf-${course.id}`} type="number" min="0" step="0.01" inputMode="decimal" className={input} value={form.course_fee} onChange={(e) => setForm({ ...form, course_fee: e.target.value })} />
      </Field>
      <Field label={`Registration fee (${form.currency})`} htmlFor={`rf-${course.id}`} error={errors.registration_fee}>
        <input id={`rf-${course.id}`} type="number" min="0" step="0.01" inputMode="decimal" className={input} value={form.registration_fee} onChange={(e) => setForm({ ...form, registration_fee: e.target.value })} />
      </Field>
      <Field label="Takes effect" htmlFor={`ef-${course.id}`} error={errors.effective_from} hint="Blank = immediately">
        <input id={`ef-${course.id}`} type="datetime-local" className={input} value={form.effective_from} onChange={(e) => setForm({ ...form, effective_from: e.target.value })} />
      </Field>
      <Field label="Note (optional)" htmlFor={`pn-${course.id}`} className="sm:col-span-3">
        <input id={`pn-${course.id}`} className={input} value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} placeholder="Why the price changed" maxLength={1000} />
      </Field>
      <div className="flex gap-2 sm:col-span-3">
        <Button type="submit" disabled={pending} className="gap-2">{pending && <Loader2 className="size-4 animate-spin" />} Save new price</Button>
        <Button type="button" variant="outline" onClick={() => onDone('')} disabled={pending}>Cancel</Button>
      </div>
    </form>
  )
}

function CourseCard({ course, canEdit }: { course: CourseWithPrices; canEdit: boolean }) {
  const router = useRouter()
  const [mode, setMode] = useState<null | 'edit' | 'price'>(null)
  const [showHistory, setShowHistory] = useState(false)
  const [msg, setMsg] = useState<Msg>(null)
  const [pending, start] = useTransition()
  const now = Date.now()
  const cur = currentPrice(course.prices, now)
  const done = (text: string) => { setMode(null); setMsg(text ? { ok: true, text } : null) }

  return (
    <Card className="p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-heading text-lg font-bold text-foreground">{course.name}</h2>
            <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-semibold', STATUS_STYLE[course.status])}>
              {COURSE_STATUSES.find((s) => s.value === course.status)?.label}
            </span>
            {course.status === 'active' && !course.accepting_applications && (
              <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-semibold text-muted-foreground">Closed for applications</span>
            )}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {[course.duration, studyModeLabel(course.study_mode), `${course.application_count} application${course.application_count === 1 ? '' : 's'}`].filter(Boolean).join(' · ')}
          </p>
          <p className="mt-2 text-base text-foreground">
            {cur ? (
              <>Registration <strong>{formatMoney(cur.registration_fee, cur.currency)}</strong> · Course <strong>{formatMoney(cur.course_fee, cur.currency)}</strong> · Total <strong>{formatMoney(Number(cur.course_fee) + Number(cur.registration_fee), cur.currency)}</strong></>
            ) : (
              <span className="text-[color:var(--gold-strong)]">No fees set — applicants see “Fees to be confirmed”.</span>
            )}
          </p>
        </div>
        {canEdit && !mode && (
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => setMode('edit')} className="gap-1.5"><Pencil className="size-4" /> Edit</Button>
            <Button size="sm" onClick={() => setMode('price')} className="gap-1.5"><Plus className="size-4" /> Change price</Button>
          </div>
        )}
      </div>

      <div className="mt-4 space-y-4">
        <Notice msg={msg} />
        {mode === 'edit' && (
          <CourseForm
            initial={{
              id: course.id, name: course.name, description: course.description ?? '', duration: course.duration ?? '',
              study_mode: course.study_mode, status: course.status, accepting_applications: course.accepting_applications,
              sort_order: String(course.sort_order),
            }}
            onDone={done}
          />
        )}
        {mode === 'price' && <PriceForm course={course} onDone={done} />}

        {course.prices.length > 0 && (
          <div>
            <button type="button" onClick={() => setShowHistory((s) => !s)} aria-expanded={showHistory}
              className="flex items-center gap-1 text-sm font-semibold text-primary hover:underline">
              {showHistory ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />} Price history ({course.prices.length})
            </button>
            {showHistory && (
              <div className="mt-2 overflow-x-auto">
                <table className="w-full min-w-[520px] text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                      <th className="py-2 pr-3">From</th><th className="py-2 pr-3 text-right">Registration</th>
                      <th className="py-2 pr-3 text-right">Course</th><th className="py-2 pr-3">Note</th><th className="py-2" />
                    </tr>
                  </thead>
                  <tbody>
                    {course.prices.map((p) => {
                      const scheduled = new Date(p.effective_from).getTime() > now
                      return (
                        <tr key={p.id} className="border-b border-border/60 last:border-0">
                          <td className="py-2 pr-3">{new Date(p.effective_from).toLocaleString('en-ZA', { dateStyle: 'medium', timeStyle: 'short' })}</td>
                          <td className="py-2 pr-3 text-right">{formatMoney(p.registration_fee, p.currency)}</td>
                          <td className="py-2 pr-3 text-right">{formatMoney(p.course_fee, p.currency)}</td>
                          <td className="py-2 pr-3 text-muted-foreground">{p.note}</td>
                          <td className="py-2 text-right">
                            {p.id === cur?.id && <span className="rounded-full bg-success/15 px-2 py-0.5 text-xs font-semibold text-success">Current</span>}
                            {scheduled && (
                              <span className="inline-flex items-center gap-1">
                                <span className="rounded-full bg-gold/15 px-2 py-0.5 text-xs font-semibold text-[color:var(--gold-strong)]">Scheduled</span>
                                {canEdit && (
                                  <button type="button" aria-label="Remove scheduled price" disabled={pending}
                                    onClick={() => start(async () => {
                                      const res = await deleteScheduledPrice(p.id)
                                      setMsg(res.success ? { ok: true, text: 'Scheduled price removed.' } : { ok: false, text: res.error })
                                      router.refresh()
                                    })}
                                    className="rounded p-1 text-muted-foreground hover:text-destructive">
                                    <Trash2 className="size-4" />
                                  </button>
                                )}
                              </span>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  )
}

export function CoursesManager({ courses, canEdit }: { courses: CourseWithPrices[]; canEdit: boolean }) {
  const [creating, setCreating] = useState(false)
  const [msg, setMsg] = useState<Msg>(null)

  return (
    <div className="space-y-4">
      {!canEdit && (
        <p className="rounded-xl bg-muted px-4 py-3 text-sm text-muted-foreground">
          You can view courses. Only administrators can change courses and fees.
        </p>
      )}
      <Notice msg={msg} />
      {canEdit && (creating ? (
        <Card className="p-6">
          <h2 className="mb-4 font-heading text-lg font-bold">New course</h2>
          <CourseForm initial={BLANK} onDone={(text) => { setCreating(false); setMsg(text ? { ok: true, text } : null) }} />
        </Card>
      ) : (
        <Button onClick={() => { setCreating(true); setMsg(null) }} className="gap-2"><Plus className="size-4" /> Add course</Button>
      ))}
      {courses.length === 0 ? (
        <Card className="p-10 text-center text-muted-foreground">No courses yet.</Card>
      ) : (
        courses.map((c) => <CourseCard key={c.id} course={c} canEdit={canEdit} />)
      )}
    </div>
  )
}
