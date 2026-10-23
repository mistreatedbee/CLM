'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowDown, ArrowUp, Loader2, Plus, RotateCcw, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { saveSiteContent } from '@/app/actions/website'
import type { SiteContent } from '@/lib/site-content'

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

function Field({ label, htmlFor, hint, children, className }: { label: string; htmlFor: string; hint?: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <label htmlFor={htmlFor} className="text-sm font-semibold text-muted-foreground">{label}</label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  )
}

function Section({ title, onReset, children }: { title: string; onReset?: () => void; children: React.ReactNode }) {
  return (
    <Card className="p-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="font-heading text-lg font-bold text-foreground">{title}</h2>
        {onReset && (
          <button type="button" onClick={onReset} className="flex items-center gap-1 rounded-lg px-2 py-1 text-sm text-muted-foreground hover:bg-muted">
            <RotateCcw className="size-3.5" /> Reset to original
          </button>
        )}
      </div>
      {children}
    </Card>
  )
}

function Check({ checked, onChange, children }: { checked: boolean; onChange: (v: boolean) => void; children: React.ReactNode }) {
  return (
    <label className="flex items-center gap-2 text-base">
      <input type="checkbox" className="size-4 accent-primary" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      {children}
    </label>
  )
}

export function WebsiteEditor({ initial, defaults, canEdit }: { initial: SiteContent; defaults: SiteContent; canEdit: boolean }) {
  const router = useRouter()
  const [c, setC] = useState(initial)
  const [dirty, setDirty] = useState(false)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [pending, start] = useTransition()

  const update = (fn: (d: SiteContent) => void) => {
    setC((prev) => { const next = structuredClone(prev); fn(next); return next })
    setDirty(true)
    setMsg(null)
  }
  const reset = <K extends keyof SiteContent>(k: K) => () => update((d) => { d[k] = structuredClone(defaults[k]) })

  function save() {
    start(async () => {
      const res = await saveSiteContent(c)
      if (!res.success) { setMsg({ ok: false, text: res.error }); return }
      setDirty(false)
      setMsg({ ok: true, text: 'Saved. The website now shows your changes.' })
      router.refresh()
    })
  }

  return (
    <div className="space-y-6 pb-24">
      {!canEdit && (
        <p className="rounded-xl bg-muted px-4 py-3 text-sm text-muted-foreground">You can view this page. Only administrators can change the website.</p>
      )}
      {msg && (
        <p role={msg.ok ? 'status' : 'alert'} className={cn('rounded-xl px-4 py-3 text-sm font-medium', msg.ok ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive')}>
          {msg.text}
        </p>
      )}

      <fieldset disabled={!canEdit || pending} className="space-y-6">
        <Section title="Announcement banner" onReset={reset('announcement')}>
          <div className="grid gap-4 sm:grid-cols-2">
            <p className="text-sm text-muted-foreground sm:col-span-2">A strip across the top of the homepage for news, e.g. registration closing dates.</p>
            <div className="sm:col-span-2"><Check checked={c.announcement.enabled} onChange={(v) => update((d) => { d.announcement.enabled = v })}>Show the announcement</Check></div>
            <Field label="Message" htmlFor="a-t" className="sm:col-span-2">
              <input id="a-t" className={input} maxLength={300} value={c.announcement.text} placeholder="e.g. Registration for the Diploma in Theology closes 30 November"
                onChange={(e) => update((d) => { d.announcement.text = e.target.value })} />
            </Field>
            <Field label="Link text (optional)" htmlFor="a-l">
              <input id="a-l" className={input} maxLength={60} value={c.announcement.link_label} placeholder="e.g. Register now"
                onChange={(e) => update((d) => { d.announcement.link_label = e.target.value })} />
            </Field>
            <Field label="Link address (optional)" htmlFor="a-u" hint="e.g. /apply or https://…">
              <input id="a-u" className={input} maxLength={500} value={c.announcement.link_url}
                onChange={(e) => update((d) => { d.announcement.link_url = e.target.value })} />
            </Field>
          </div>
        </Section>

        <Section title="Homepage — top section" onReset={reset('hero')}>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Small badge above the logo" htmlFor="h-b" hint="Leave empty to hide" className="sm:col-span-2">
              <input id="h-b" className={input} maxLength={120} value={c.hero.badge} onChange={(e) => update((d) => { d.hero.badge = e.target.value })} />
            </Field>
            <Field label="Heading" htmlFor="h-t1">
              <input id="h-t1" className={input} maxLength={80} value={c.hero.title_main} onChange={(e) => update((d) => { d.hero.title_main = e.target.value })} />
            </Field>
            <Field label="Heading — highlighted word(s)" htmlFor="h-t2">
              <input id="h-t2" className={input} maxLength={80} value={c.hero.title_accent} onChange={(e) => update((d) => { d.hero.title_accent = e.target.value })} />
            </Field>
            <Field label="Tagline" htmlFor="h-tg" className="sm:col-span-2">
              <input id="h-tg" className={input} maxLength={200} value={c.hero.tagline} onChange={(e) => update((d) => { d.hero.tagline = e.target.value })} />
            </Field>
            <Field label="Description" htmlFor="h-d" className="sm:col-span-2">
              <textarea id="h-d" rows={3} className={area} maxLength={1000} value={c.hero.description} onChange={(e) => update((d) => { d.hero.description = e.target.value })} />
            </Field>
            <Field label="Button text" htmlFor="h-btn">
              <input id="h-btn" className={input} maxLength={60} value={c.hero.button_label} onChange={(e) => update((d) => { d.hero.button_label = e.target.value })} />
            </Field>
            <Field label="Small print under the button" htmlFor="h-sp">
              <input id="h-sp" className={input} maxLength={200} value={c.hero.small_print} onChange={(e) => update((d) => { d.hero.small_print = e.target.value })} />
            </Field>
          </div>
        </Section>

        <Section title="Homepage — courses section" onReset={reset('courses_section')}>
          <div className="grid gap-4">
            <Check checked={c.courses_section.enabled} onChange={(v) => update((d) => { d.courses_section.enabled = v })}>Show the courses section</Check>
            <Field label="Heading" htmlFor="cs-t">
              <input id="cs-t" className={input} maxLength={160} value={c.courses_section.title} onChange={(e) => update((d) => { d.courses_section.title = e.target.value })} />
            </Field>
            <Field label="Subheading" htmlFor="cs-s">
              <input id="cs-s" className={input} maxLength={400} value={c.courses_section.subtitle} onChange={(e) => update((d) => { d.courses_section.subtitle = e.target.value })} />
            </Field>
            <p className="text-sm text-muted-foreground">
              The courses and fees themselves are edited under <a href="/admin/courses" className="font-semibold text-primary hover:underline">Courses &amp; fees</a>.
            </p>
          </div>
        </Section>

        <Section title="Homepage — why join" onReset={reset('why_join')}>
          <div className="grid gap-4">
            <Check checked={c.why_join.enabled} onChange={(v) => update((d) => { d.why_join.enabled = v })}>Show this section</Check>
            <Field label="Heading" htmlFor="w-t">
              <input id="w-t" className={input} maxLength={160} value={c.why_join.title} onChange={(e) => update((d) => { d.why_join.title = e.target.value })} />
            </Field>
            <Field label="Introduction" htmlFor="w-i">
              <textarea id="w-i" rows={2} className={area} maxLength={1000} value={c.why_join.intro} onChange={(e) => update((d) => { d.why_join.intro = e.target.value })} />
            </Field>
            <ol className="space-y-3">
              {c.why_join.items.map((item, i) => (
                <li key={i} className="flex gap-3 rounded-xl border border-border p-3">
                  <div className="flex flex-col gap-1">
                    <button type="button" aria-label="Move up" disabled={i === 0} className="rounded p-1 hover:bg-muted disabled:opacity-30"
                      onClick={() => update((d) => { d.why_join.items = move(d.why_join.items, i, i - 1) })}><ArrowUp className="size-4" /></button>
                    <button type="button" aria-label="Move down" disabled={i === c.why_join.items.length - 1} className="rounded p-1 hover:bg-muted disabled:opacity-30"
                      onClick={() => update((d) => { d.why_join.items = move(d.why_join.items, i, i + 1) })}><ArrowDown className="size-4" /></button>
                  </div>
                  <div className="grid flex-1 gap-3">
                    <Field label="Title" htmlFor={`wi-t-${i}`}>
                      <input id={`wi-t-${i}`} className={input} maxLength={120} value={item.title} onChange={(e) => update((d) => { d.why_join.items[i].title = e.target.value })} />
                    </Field>
                    <Field label="Text" htmlFor={`wi-x-${i}`}>
                      <textarea id={`wi-x-${i}`} rows={2} className={area} maxLength={600} value={item.text} onChange={(e) => update((d) => { d.why_join.items[i].text = e.target.value })} />
                    </Field>
                  </div>
                  <button type="button" aria-label={`Remove ${item.title || 'item'}`} className="self-start rounded p-1 text-muted-foreground hover:text-destructive"
                    onClick={() => update((d) => { d.why_join.items.splice(i, 1) })}><Trash2 className="size-4" /></button>
                </li>
              ))}
            </ol>
            <Button type="button" variant="outline" size="sm" className="gap-1 self-start" onClick={() => update((d) => { d.why_join.items.push({ title: '', text: '' }) })}>
              <Plus className="size-4" /> Add item
            </Button>
          </div>
        </Section>

        <Section title="Contact details (website footer)" onReset={reset('contact')}>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Short description" htmlFor="c-b" className="sm:col-span-2">
              <textarea id="c-b" rows={2} className={area} maxLength={400} value={c.contact.footer_blurb} onChange={(e) => update((d) => { d.contact.footer_blurb = e.target.value })} />
            </Field>
            <Field label="Phone" htmlFor="c-p" hint="Leave empty to hide">
              <input id="c-p" type="tel" className={input} maxLength={40} value={c.contact.phone} onChange={(e) => update((d) => { d.contact.phone = e.target.value })} />
            </Field>
            <Field label="Email" htmlFor="c-e" hint="Leave empty to hide">
              <input id="c-e" type="email" className={input} maxLength={200} value={c.contact.email} onChange={(e) => update((d) => { d.contact.email = e.target.value })} />
            </Field>
            <Field label="Website" htmlFor="c-w" hint="Full address starting with https://">
              <input id="c-w" className={input} maxLength={300} value={c.contact.website} onChange={(e) => update((d) => { d.contact.website = e.target.value })} />
            </Field>
            <Field label="Address" htmlFor="c-a">
              <input id="c-a" className={input} maxLength={300} value={c.contact.address} onChange={(e) => update((d) => { d.contact.address = e.target.value })} />
            </Field>
            <Field label="Office hours (one line each)" htmlFor="c-h" className="sm:col-span-2">
              <textarea id="c-h" rows={3} className={area} value={c.contact.office_hours.join('\n')} onChange={(e) => update((d) => { d.contact.office_hours = e.target.value.split('\n') })} />
            </Field>
          </div>
        </Section>

        <Section title="Application page" onReset={reset('apply')}>
          <div className="grid gap-4">
            <Field label="Help phone number (top of the form)" htmlFor="ap-p" hint="Leave empty to hide">
              <input id="ap-p" type="tel" className={input} maxLength={40} value={c.apply.help_phone} onChange={(e) => update((d) => { d.apply.help_phone = e.target.value })} />
            </Field>
            <Field label="Message after submitting" htmlFor="ap-m">
              <textarea id="ap-m" rows={3} className={area} maxLength={1000} value={c.apply.submitted_message} onChange={(e) => update((d) => { d.apply.submitted_message = e.target.value })} />
            </Field>
            <Field label="“What happens next” steps (one per line)" htmlFor="ap-n">
              <textarea id="ap-n" rows={4} className={area} value={c.apply.next_steps.join('\n')} onChange={(e) => update((d) => { d.apply.next_steps = e.target.value.split('\n') })} />
            </Field>
          </div>
        </Section>
      </fieldset>

      {canEdit && (
        <div className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-card/95 px-4 py-3 backdrop-blur lg:left-72">
          <div className="mx-auto flex max-w-4xl items-center justify-end gap-3">
            {dirty && <span className="mr-auto text-sm font-medium text-[color:var(--gold-strong)]">Unsaved changes</span>}
            <Button onClick={save} disabled={pending || !dirty} className="gap-2">
              {pending && <Loader2 className="size-4 animate-spin" />} Save &amp; publish
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
