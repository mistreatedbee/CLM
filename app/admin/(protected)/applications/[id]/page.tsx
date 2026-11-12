import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, CheckSquare, Square } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { StatusBadge } from '@/components/admin/status-badge'
import { ReviewActions } from '@/components/admin/review-actions'
import { createClient } from '@/lib/supabase/server'
import { extractFromNotes, formatDate } from '@/lib/clm-data'
import type { ApplicationStatus } from '@/lib/clm-data'
import { formatMoney, type PriceQuote } from '@/lib/courses'
import { getPublishedForm } from '@/lib/form-config-server'
import { CORE_FIELDS, fieldLabels, type Answers } from '@/lib/form-config'
import { ApplicationEditor, type EditSection } from '@/components/admin/application-editor'
import { DOCUMENTS_BUCKET } from '@/lib/documents-server'

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="mb-4 border-b border-border pb-2 font-heading text-lg font-bold text-foreground">
        {title}
      </h2>
      <div className="space-y-4">{children}</div>
    </div>
  )
}

function Field({
  label,
  value,
}: {
  label: string
  value: string | number | boolean | null | undefined
}) {
  if (value === null || value === undefined || value === '') return null
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-sm font-semibold text-muted-foreground">{label}</span>
      {typeof value === 'boolean' ? (
        <span className="flex items-center gap-1.5 text-base text-foreground">
          {value ? (
            <CheckSquare className="size-4 text-success" />
          ) : (
            <Square className="size-4 text-muted-foreground" />
          )}
          {value ? 'Yes' : 'No'}
        </span>
      ) : (
        <span className="whitespace-pre-wrap text-base leading-relaxed text-foreground">
          {String(value)}
        </span>
      )}
    </div>
  )
}

export default async function ApplicationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const [{ data: app }, { data: notes }, { data: edits }] = await Promise.all([
    supabase.from('clm_applications').select('*').eq('id', id).single(),
    supabase
      .from('application_notes')
      .select('*')
      .eq('application_id', id)
      .order('created_at', { ascending: false }),
    supabase
      .from('audit_logs')
      .select('id, actor_name, metadata, created_at')
      .eq('target_type', 'clm_applications')
      .eq('target_id', id)
      .eq('action', 'edited')
      .order('created_at', { ascending: false })
      .limit(50),
  ])

  if (!app) notFound()

  // Answers to questions added in Admin > Application form.
  const publishedForm = await getPublishedForm()
  const labels = fieldLabels(publishedForm)
  // Uploaded documents: short-lived private links (storage access is checked for admins).
  const rawDocs = ((app as { documents?: { type: string; path: string; name: string }[] }).documents ?? [])
  const documents = await Promise.all(rawDocs.map(async (d) => {
    const { data } = await supabase.storage.from(DOCUMENTS_BUCKET).createSignedUrl(d.path, 600)
    return { ...d, label: publishedForm.documents.find((x) => x.type === d.type)?.label ?? d.type.replace(/_/g, ' '), url: data?.signedUrl ?? null }
  }))
  const declarationAccepted = (app as { declaration_accepted?: boolean | null }).declaration_accepted
  // Current answers for the editor, using the questions on the live form.
  const row = app as unknown as Record<string, unknown>
  const storedCustom = (row.custom_answers ?? {}) as Record<string, unknown>
  const answerOf = (key: string) => (CORE_FIELDS[key] ? row[CORE_FIELDS[key].column] : storedCustom[key])
  const editValues: Answers = {}
  const editSections: EditSection[] = publishedForm.steps
    .map((s) => ({
      title: s.title,
      fields: s.fields.filter((f) => {
        const v = answerOf(f.key)
        return f.enabled || (v !== null && v !== undefined && v !== '')
      }),
    }))
    .filter((s) => s.fields.length > 0)
  for (const s of editSections) for (const f of s.fields) {
    const v = answerOf(f.key)
    editValues[f.key] = typeof v === 'boolean' ? v : v === null || v === undefined ? '' : String(v)
  }
  const columnLabels: Record<string, string> = {}
  for (const [key, def] of Object.entries(CORE_FIELDS)) columnLabels[def.column] = labels[key] ?? key
  const editHistory = ((edits ?? []) as { id: string; actor_name: string | null; metadata: Record<string, { from: unknown; to: unknown }> | null; created_at: string }[])
    .flatMap((e) => Object.entries(e.metadata ?? {}).flatMap(([col, change]) => {
      if (col === 'custom_answers') {
        const from = (change.from ?? {}) as Record<string, unknown>
        const to = (change.to ?? {}) as Record<string, unknown>
        return Object.keys({ ...from, ...to })
          .filter((k) => JSON.stringify(from[k] ?? null) !== JSON.stringify(to[k] ?? null))
          .map((k) => ({ key: `${e.id}-${k}`, who: e.actor_name, when: e.created_at, label: labels[k] ?? k, from: from[k], to: to[k] }))
      }
      return [{ key: `${e.id}-${col}`, who: e.actor_name, when: e.created_at, label: columnLabels[col] ?? col.replace(/_/g, ' '), from: change.from, to: change.to }]
    }))
  const show = (v: unknown) => (v === true ? 'Yes' : v === false ? 'No' : v === null || v === undefined || v === '' ? '(empty)' : String(v))

  const customAnswers = Object.entries(((app as { custom_answers?: Record<string, unknown> }).custom_answers ?? {}) as Record<string, unknown>)
    .filter(([, v]) => v !== null && v !== '' && v !== undefined)

  // WhatsApp data — gracefully handle missing tables (migration not yet run)
  const [waLogsResult, waTemplatesResult, waSettingsResult] = await Promise.allSettled([
    supabase
      .from('whatsapp_logs')
      .select('*')
      .eq('application_id', id)
      .order('sent_at', { ascending: false }),
    supabase
      .from('whatsapp_templates')
      .select('*')
      .eq('active', true)
      .order('trigger_type')
      .order('name'),
    supabase.from('whatsapp_settings').select('*').single(),
  ])

  const waLogs =
    waLogsResult.status === 'fulfilled' ? (waLogsResult.value.data ?? []) : []
  const waTemplates =
    waTemplatesResult.status === 'fulfilled' ? (waTemplatesResult.value.data ?? []) : []
  const waSettings =
    waSettingsResult.status === 'fulfilled' ? waSettingsResult.value.data : null

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-6">
        <Link
          href="/admin/applications"
          className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> Back to applications
        </Link>
      </div>

      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
            {app.full_name}
          </h1>
          <p className="mt-1 text-base text-muted-foreground">
            {app.ref} · Submitted {formatDate(app.created_at)}
          </p>
        </div>
        <StatusBadge status={app.status} className="text-base" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Application details */}
        <div className="space-y-6 lg:col-span-2">
          <ApplicationEditor applicationId={app.id} sections={editSections} values={editValues} />

          <Card className="space-y-8 p-6">
            <Section title="Course">
              <Field label="Applying for" value={app.course_name ?? 'Membership only (no course)'} />
              {app.price_snapshot && (() => {
                const p = app.price_snapshot as unknown as PriceQuote
                return (
                  <Field
                    label="Fees quoted at submission (fixed)"
                    value={`${formatMoney(p.total, p.currency)} — course ${formatMoney(p.course_fee, p.currency)} + registration ${formatMoney(p.registration_fee, p.currency)}`}
                  />
                )
              })()}
            </Section>

            {customAnswers.length > 0 && (
              <Section title="Additional questions">
                {customAnswers.map(([key, value]) => (
                  <Field
                    key={key}
                    label={labels[key] ?? key.replace(/^custom_/, '').replace(/_/g, ' ')}
                    value={typeof value === 'boolean' ? value : String(value)}
                  />
                ))}
              </Section>
            )}

            {(documents.length > 0 || declarationAccepted !== null && declarationAccepted !== undefined) && (
              <Section title="Documents & declaration">
                {documents.map((d) => (
                  <div key={d.path} className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-muted/50 p-3">
                    <div>
                      <p className="text-sm font-semibold text-muted-foreground">{d.label}</p>
                      <p className="text-base text-foreground">{d.name}</p>
                    </div>
                    {d.url ? (
                      <a href={d.url} target="_blank" rel="noopener noreferrer" className="rounded-lg border border-border px-3 py-1.5 text-sm font-semibold hover:border-primary hover:text-primary">
                        View file
                      </a>
                    ) : <span className="text-sm text-destructive">File missing</span>}
                  </div>
                ))}
                {documents.length > 0 && <p className="text-xs text-muted-foreground">Links are private and expire after 10 minutes.</p>}
                {declarationAccepted !== null && declarationAccepted !== undefined && (
                  <Field label="Declaration" value={declarationAccepted ? 'Accepted' : 'Not accepted'} />
                )}
              </Section>
            )}

            <Section title="Personal information">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Full name" value={app.full_name} />
                <Field label="ID number" value={app.id_number} />
                <Field label="Gender" value={app.gender} />
                <Field label="Marital status" value={app.marital_status} />
                <Field label="WhatsApp" value={app.whatsapp ?? app.phone} />
                <Field
                  label="Phone / Home"
                  value={
                    extractFromNotes(app.admin_notes, 'Home/Phone') ??
                    (app.whatsapp ? app.phone : null)
                  }
                />
                <Field label="Country" value={app.country} />
              </div>
              <Field label="Address" value={app.physical_address} />
            </Section>

            <Section title="Spiritual background">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Accepted Christ" value={app.accepted_christ_date} />
                <Field label="Baptized" value={app.baptized} />
                <Field label="Attends church regularly" value={app.attends_church} />
                <Field label="Church name" value={app.church_name} />
                <Field label="Denomination" value={app.church_denomination} />
                <Field label="Pastor / leader" value={app.pastor_name} />
                <Field label="Serves in ministry" value={app.serves_ministry} />
              </div>
              {app.ministry_detail && (
                <Field label="Ministry details" value={app.ministry_detail} />
              )}
            </Section>

            <Section title="Leadership">
              <Field label="Why joining CLM" value={app.reason_joining} />
              <Field label="Leadership experience" value={app.leadership_experience} />
              <Field label="Spiritual gifts" value={app.spiritual_gifts} />
              <Field label="Areas for growth" value={app.growth_areas} />
            </Section>

            <Section title="Vision & calling">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Called to leadership" value={app.called_to_leadership} />
              </div>
              <Field label="Calling explanation" value={app.leadership_vision_explanation} />
              <Field label="Long-term vision" value={app.long_term_vision} />
            </Section>

            <Section title="Reference">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Reference name" value={app.reference_name} />
                <Field label="Reference phone" value={app.reference_phone} />
                <Field label="Relationship" value={app.reference_relationship} />
              </div>
            </Section>

            <Section title="Declaration">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Signature" value={app.signature} />
                <Field label="Date signed" value={app.signature_date} />
              </div>
            </Section>
          </Card>

          {editHistory.length > 0 && (
            <Card className="p-6">
              <h2 className="mb-4 border-b border-border pb-2 font-heading text-lg font-bold text-foreground">
                Edit history
              </h2>
              <ol className="space-y-4">
                {editHistory.map((h) => (
                  <li key={h.key} className="text-base">
                    <p className="font-semibold text-foreground">{h.label}</p>
                    <p className="text-muted-foreground">
                      <span className="line-through">{show(h.from)}</span> → <span className="text-foreground">{show(h.to)}</span>
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {h.who ?? 'Admin'} · {new Date(h.when).toLocaleString('en-ZA', { dateStyle: 'medium', timeStyle: 'short' })}
                    </p>
                  </li>
                ))}
              </ol>
            </Card>
          )}
        </div>

        {/* Review panel */}
        <div>
          <ReviewActions
            applicationId={app.id}
            initialStatus={app.status as ApplicationStatus}
            initialNotes={notes ?? []}
            applicantName={app.full_name}
            applicantWhatsapp={app.whatsapp ?? app.phone}
            submissionDate={formatDate(app.created_at)}
            initialWaLogs={waLogs ?? []}
            waTemplates={waTemplates ?? []}
            waSettings={waSettings ?? null}
          />
        </div>
      </div>
    </div>
  )
}
