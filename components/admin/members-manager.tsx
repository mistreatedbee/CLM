'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ChevronDown, ChevronUp, Download, ExternalLink, Loader2, MessageCircle, Pencil, Plus, Search, Trash2, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { addMember, removeMember, updateMember, type MemberInput } from '@/app/actions/members'
import { buildWhatsAppUrl } from '@/lib/whatsapp'

interface AppData {
  id: string; ref: string; id_number?: string; gender?: string; marital_status?: string; whatsapp?: string
  phone?: string; physical_address?: string; country?: string; accepted_christ_date?: string; baptized?: boolean
  attends_church?: boolean; church_name?: string; church_denomination?: string; pastor_name?: string
  serves_ministry?: boolean; ministry_detail?: string; reason_joining?: string; leadership_experience?: string
  spiritual_gifts?: string; growth_areas?: string; called_to_leadership?: boolean; leadership_vision_explanation?: string
  long_term_vision?: string; reference_name?: string; reference_phone?: string; reference_relationship?: string
}

export interface MemberRow {
  id: string
  member_number: string
  application_id: string | null
  full_name: string
  phone: string
  email: string | null
  id_number?: string | null
  church: string
  leadership_level: string
  status: string
  joined_date: string
  notes?: string | null
  application: AppData | null
}

const LEVELS = ['Trainee', 'Deacon', 'Elder', 'Leader']
const LEVEL_COLOURS: Record<string, string> = {
  Trainee: 'bg-gold/15 text-[color:var(--gold-strong)]',
  Deacon: 'bg-primary/15 text-primary',
  Elder: 'bg-success/15 text-success',
  Leader: 'bg-secondary text-foreground',
}
const STATUSES: Record<string, { label: string; cls: string }> = {
  active: { label: 'Active', cls: 'bg-success/15 text-success' },
  inactive: { label: 'Inactive', cls: 'bg-muted text-muted-foreground' },
  suspended: { label: 'Suspended', cls: 'bg-destructive/15 text-destructive' },
}

const input =
  'h-11 w-full rounded-xl border border-input bg-background px-3 text-base text-foreground outline-none focus:border-ring focus:ring-2 focus:ring-ring/30 disabled:opacity-60'
const PAGE = 20

function csvCell(v: unknown) {
  let s = v === null || v === undefined ? '' : String(v)
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

function Field({ label, htmlFor, error, children, className }: { label: string; htmlFor: string; error?: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <label htmlFor={htmlFor} className="text-sm font-semibold text-muted-foreground">{label}</label>
      {children}
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    </div>
  )
}

function Detail({ label, value }: { label: string; value: string | boolean | null | undefined }) {
  if (value === null || value === undefined || value === '') return null
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</span>
      <span className="whitespace-pre-wrap text-sm text-foreground">{typeof value === 'boolean' ? (value ? 'Yes' : 'No') : value}</span>
    </div>
  )
}

function toInput(m?: MemberRow): MemberInput {
  return {
    full_name: m?.full_name ?? '',
    phone: m?.phone ?? '',
    email: m?.email ?? '',
    id_number: m?.id_number ?? m?.application?.id_number ?? '',
    church: m?.church ?? '',
    leadership_level: m?.leadership_level ?? 'Trainee',
    status: m?.status ?? 'active',
    joined_date: m?.joined_date ?? new Date().toISOString().slice(0, 10),
    notes: m?.notes ?? '',
  }
}

function MemberForm({ initial, submitLabel, onSubmit, onCancel }: {
  initial: MemberInput
  submitLabel: string
  onSubmit: (v: MemberInput) => Promise<{ success: true } | { success: false; error: string; errors?: Record<string, string> }>
  onCancel: () => void
}) {
  const [v, setV] = useState(initial)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [error, setError] = useState<string | null>(null)
  const [pending, start] = useTransition()
  const id = useMemo(() => Math.random().toString(36).slice(2, 8), [])
  const set = <K extends keyof MemberInput>(k: K, val: MemberInput[K]) => setV((x) => ({ ...x, [k]: val }))

  return (
    <form noValidate className="grid gap-4 sm:grid-cols-2"
      onSubmit={(e) => {
        e.preventDefault()
        start(async () => {
          const res = await onSubmit(v)
          if (!res.success) { setErrors(res.errors ?? {}); setError(res.error) }
        })
      }}>
      {error && <p role="alert" className="rounded-xl bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive sm:col-span-2">{error}</p>}
      <Field label="Full name" htmlFor={`mn-${id}`} error={errors.full_name}>
        <input id={`mn-${id}`} className={input} value={v.full_name} onChange={(e) => set('full_name', e.target.value)} />
      </Field>
      <Field label="ID number" htmlFor={`mi-${id}`}>
        <input id={`mi-${id}`} className={input} value={v.id_number} onChange={(e) => set('id_number', e.target.value)} />
      </Field>
      <Field label="Phone / WhatsApp" htmlFor={`mp-${id}`} error={errors.phone}>
        <input id={`mp-${id}`} type="tel" className={input} value={v.phone} onChange={(e) => set('phone', e.target.value)} />
      </Field>
      <Field label="Email (optional)" htmlFor={`me-${id}`} error={errors.email}>
        <input id={`me-${id}`} type="email" className={input} value={v.email} onChange={(e) => set('email', e.target.value)} />
      </Field>
      <Field label="Church" htmlFor={`mc-${id}`} error={errors.church}>
        <input id={`mc-${id}`} className={input} value={v.church} onChange={(e) => set('church', e.target.value)} />
      </Field>
      <Field label="Leadership level" htmlFor={`ml-${id}`} error={errors.leadership_level}>
        <select id={`ml-${id}`} className={input} value={v.leadership_level} onChange={(e) => set('leadership_level', e.target.value)}>
          {LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
        </select>
      </Field>
      <Field label="Status" htmlFor={`ms-${id}`} error={errors.status}>
        <select id={`ms-${id}`} className={input} value={v.status} onChange={(e) => set('status', e.target.value)}>
          {Object.entries(STATUSES).map(([k, s]) => <option key={k} value={k}>{s.label}</option>)}
        </select>
      </Field>
      <Field label="Joined on" htmlFor={`mj-${id}`} error={errors.joined_date}>
        <input id={`mj-${id}`} type="date" className={input} value={v.joined_date} onChange={(e) => set('joined_date', e.target.value)} />
      </Field>
      <Field label="Notes (internal)" htmlFor={`mo-${id}`} error={errors.notes} className="sm:col-span-2">
        <textarea id={`mo-${id}`} rows={3} className={cn(input, 'h-auto py-2')} value={v.notes} onChange={(e) => set('notes', e.target.value)} />
      </Field>
      <div className="flex gap-2 sm:col-span-2">
        <Button type="submit" disabled={pending} className="gap-2">{pending && <Loader2 className="size-4 animate-spin" />} {submitLabel}</Button>
        <Button type="button" variant="outline" onClick={onCancel} disabled={pending}>Cancel</Button>
      </div>
    </form>
  )
}

export function MembersManager({ members }: { members: MemberRow[] }) {
  const router = useRouter()
  const [q, setQ] = useState('')
  const [level, setLevel] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const [adding, setAdding] = useState(false)
  const [open, setOpen] = useState<string | null>(null)
  const [editing, setEditing] = useState<string | null>(null)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [pending, start] = useTransition()

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase()
    return members.filter((m) =>
      (!level || m.leadership_level === level) &&
      (!status || m.status === status) &&
      (!term || [m.full_name, m.member_number, m.phone, m.email, m.church, m.id_number].some((x) => x?.toLowerCase().includes(term))),
    )
  }, [members, q, level, status])
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE))
  const shown = filtered.slice((page - 1) * PAGE, page * PAGE)

  function exportCsv(list: MemberRow[] = filtered, name = `clm-members-${new Date().toISOString().slice(0, 10)}`) {
    const rows = [
      ['Member number', 'Full name', 'ID number', 'Phone', 'Email', 'Church', 'Level', 'Status', 'Joined', 'Source', 'Notes'],
      ...list.map((m) => [m.member_number, m.full_name, m.id_number ?? m.application?.id_number, m.phone, m.email, m.church,
        m.leadership_level, m.status, m.joined_date, m.application_id ? 'Application' : 'Added by admin', m.notes]),
    ]
    const blob = new Blob(['﻿' + rows.map((r) => r.map(csvCell).join(',')).join('\r\n')], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${name.replace(/[^\w.-]+/g, '_')}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const done = (text: string) => { setMsg({ ok: true, text }); router.refresh() }

  return (
    <div className="space-y-5">
      {msg && (
        <p role={msg.ok ? 'status' : 'alert'} className={cn('rounded-xl px-4 py-3 text-sm font-medium', msg.ok ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive')}>
          {msg.text}
        </p>
      )}

      <div className="grid gap-3 sm:grid-cols-4">
        {LEVELS.map((l) => {
          const n = members.filter((m) => m.leadership_level === l).length
          return (
            <button key={l} type="button" aria-pressed={level === l} onClick={() => { setLevel(level === l ? '' : l); setPage(1) }}
              className={cn('rounded-2xl border bg-card p-4 text-left transition hover:border-primary/40', level === l ? 'border-primary ring-2 ring-primary/20' : 'border-border')}>
              <p className="text-sm text-muted-foreground">{l}</p>
              <p className="font-heading text-2xl font-extrabold">{n}</p>
            </button>
          )
        })}
      </div>

      <Card className="flex flex-col gap-3 p-4 lg:flex-row lg:items-end">
        <div className="relative flex-1">
          <label htmlFor="m-q" className="mb-1 block text-sm font-semibold text-muted-foreground">Search</label>
          <Search className="pointer-events-none absolute bottom-3.5 left-3 size-4 text-muted-foreground" />
          <input id="m-q" className={cn(input, 'pl-9')} placeholder="Name, member number, phone, church…" value={q}
            onChange={(e) => { setQ(e.target.value); setPage(1) }} />
        </div>
        <div className="lg:w-48">
          <label htmlFor="m-s" className="mb-1 block text-sm font-semibold text-muted-foreground">Status</label>
          <select id="m-s" className={input} value={status} onChange={(e) => { setStatus(e.target.value); setPage(1) }}>
            <option value="">All statuses</option>
            {Object.entries(STATUSES).map(([k, s]) => <option key={k} value={k}>{s.label}</option>)}
          </select>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => exportCsv()} disabled={filtered.length === 0} className="h-11 gap-2">
            <Download className="size-4" /> Export {filtered.length}
          </Button>
          {!adding && <Button onClick={() => { setAdding(true); setMsg(null) }} className="h-11 gap-2"><Plus className="size-4" /> Add member</Button>}
        </div>
      </Card>

      {adding && (
        <Card className="p-6">
          <h2 className="mb-1 font-heading text-lg font-bold">Add a member</h2>
          <p className="mb-4 text-sm text-muted-foreground">For people who joined without the online application. A member number is assigned automatically.</p>
          <MemberForm initial={toInput()} submitLabel="Add member" onCancel={() => setAdding(false)}
            onSubmit={async (v) => {
              const res = await addMember(v)
              if (res.success) { setAdding(false); done(`${v.full_name} added.`) }
              return res
            }} />
        </Card>
      )}

      {filtered.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-16 text-center">
          <Users className="size-12 text-muted-foreground/40" />
          <p className="mt-4 text-base font-medium text-muted-foreground">
            {members.length === 0 ? 'No members yet.' : 'No members match your search.'}
          </p>
        </Card>
      ) : (
        <ul className="space-y-3">
          {shown.map((m) => {
            const app = m.application
            const isOpen = open === m.id
            const wa = app?.whatsapp || m.phone
            return (
              <li key={m.id}>
                <Card className="overflow-hidden">
                  <div className="flex flex-wrap items-center justify-between gap-3 p-4">
                    <button type="button" aria-expanded={isOpen} className="flex min-w-0 flex-1 items-center gap-3 text-left"
                      onClick={() => { setOpen(isOpen ? null : m.id); setEditing(null) }}>
                      <span className="grid size-11 shrink-0 place-items-center rounded-full bg-secondary font-heading text-sm font-bold text-primary">
                        {m.full_name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate font-heading font-bold text-foreground">{m.full_name}</span>
                        <span className="block truncate text-sm text-muted-foreground">{m.member_number} · {m.church}</span>
                      </span>
                    </button>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={cn('rounded-full px-3 py-1 text-sm font-semibold', LEVEL_COLOURS[m.leadership_level] ?? 'bg-muted')}>{m.leadership_level}</span>
                      <span className={cn('rounded-full px-3 py-1 text-sm font-semibold', STATUSES[m.status]?.cls ?? 'bg-muted')}>{STATUSES[m.status]?.label ?? m.status}</span>
                      {wa && (
                        <a href={buildWhatsAppUrl(wa)} target="_blank" rel="noopener noreferrer" aria-label={`WhatsApp ${m.full_name}`}
                          className="rounded-lg p-2 text-[#25D366] hover:bg-[#25D366]/10"><MessageCircle className="size-4" /></a>
                      )}
                      <button type="button" aria-label={isOpen ? 'Hide details' : 'Show details'} className="rounded-lg p-2 text-muted-foreground hover:bg-muted"
                        onClick={() => { setOpen(isOpen ? null : m.id); setEditing(null) }}>
                        {isOpen ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
                      </button>
                    </div>
                  </div>

                  {isOpen && (
                    <div className="border-t border-border">
                      {editing === m.id ? (
                        <div className="p-5">
                          <MemberForm initial={toInput(m)} submitLabel="Save changes" onCancel={() => setEditing(null)}
                            onSubmit={async (v) => {
                              const res = await updateMember(m.id, v)
                              if (res.success) { setEditing(null); done('Member updated.') }
                              return res
                            }} />
                        </div>
                      ) : (
                        <>
                          <div className="flex flex-wrap gap-2 px-5 pt-4">
                            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => { setEditing(m.id); setMsg(null) }}>
                              <Pencil className="size-4" /> Edit details, level &amp; status
                            </Button>
                            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => exportCsv([m], m.member_number)}>
                              <Download className="size-4" /> Export
                            </Button>
                            {app?.id && (
                              <Link href={`/admin/applications/${app.id}`} className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm font-semibold hover:border-primary hover:text-primary">
                                View application <ExternalLink className="size-3.5" />
                              </Link>
                            )}
                            {!m.application_id && (
                              <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground" disabled={pending}
                                onClick={() => {
                                  if (!window.confirm(`Remove ${m.full_name}? This member was added by hand and will be deleted permanently.`)) return
                                  start(async () => {
                                    const res = await removeMember(m.id)
                                    if (!res.success) setMsg({ ok: false, text: res.error })
                                    else done('Member removed.')
                                  })
                                }}>
                                <Trash2 className="size-4" /> Remove
                              </Button>
                            )}
                          </div>
                          <div className="divide-y divide-border">
                            <div className="grid grid-cols-2 gap-x-6 gap-y-3 px-5 py-4 sm:grid-cols-3 lg:grid-cols-4">
                              <Detail label="Phone" value={m.phone} />
                              <Detail label="Email" value={m.email} />
                              <Detail label="ID number" value={m.id_number ?? app?.id_number} />
                              <Detail label="Joined" value={new Date(m.joined_date).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' })} />
                              <Detail label="Source" value={m.application_id ? `Application ${app?.ref ?? ''}` : 'Added by admin'} />
                              <Detail label="Gender" value={app?.gender} />
                              <Detail label="Marital status" value={app?.marital_status} />
                              <Detail label="Address" value={app?.physical_address} />
                              {m.notes && <div className="col-span-full"><Detail label="Notes" value={m.notes} /></div>}
                            </div>
                            {app && (
                              <>
                                <div className="grid grid-cols-2 gap-x-6 gap-y-3 px-5 py-4 sm:grid-cols-3 lg:grid-cols-4">
                                  <Detail label="Denomination" value={app.church_denomination} />
                                  <Detail label="Pastor / leader" value={app.pastor_name} />
                                  <Detail label="Accepted Christ" value={app.accepted_christ_date} />
                                  <Detail label="Baptized" value={app.baptized} />
                                  <Detail label="Attends church" value={app.attends_church} />
                                  <Detail label="Serves in ministry" value={app.serves_ministry} />
                                  <Detail label="Ministry details" value={app.ministry_detail} />
                                </div>
                                <div className="grid grid-cols-1 gap-x-6 gap-y-3 px-5 py-4 sm:grid-cols-2">
                                  <Detail label="Why joining CLM" value={app.reason_joining} />
                                  <Detail label="Leadership experience" value={app.leadership_experience} />
                                  <Detail label="Spiritual gifts" value={app.spiritual_gifts} />
                                  <Detail label="Growth areas" value={app.growth_areas} />
                                  <Detail label="Called to leadership" value={app.called_to_leadership} />
                                  <Detail label="Long-term vision" value={app.long_term_vision} />
                                </div>
                                <div className="grid grid-cols-2 gap-x-6 gap-y-3 px-5 py-4 sm:grid-cols-3">
                                  <Detail label="Reference" value={app.reference_name} />
                                  <Detail label="Reference phone" value={app.reference_phone} />
                                  <Detail label="Relationship" value={app.reference_relationship} />
                                </div>
                              </>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </Card>
              </li>
            )
          })}
        </ul>
      )}

      {pages > 1 && (
        <nav aria-label="Pagination" className="flex items-center justify-between text-sm text-muted-foreground">
          <span>Showing {(page - 1) * PAGE + 1}–{Math.min(page * PAGE, filtered.length)} of {filtered.length}</span>
          <span className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(page - 1)}>Previous</Button>
            <Button variant="outline" size="sm" disabled={page === pages} onClick={() => setPage(page + 1)}>Next</Button>
          </span>
        </nav>
      )}
    </div>
  )
}
