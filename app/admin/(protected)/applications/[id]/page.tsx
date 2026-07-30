import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, CheckSquare, Square } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { StatusBadge } from '@/components/admin/status-badge'
import { ReviewActions } from '@/components/admin/review-actions'
import { createClient } from '@/lib/supabase/server'
import { extractFromNotes, formatDate } from '@/lib/clm-data'
import type { ApplicationStatus } from '@/lib/clm-data'

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

  const [{ data: app }, { data: notes }] = await Promise.all([
    supabase.from('clm_applications').select('*').eq('id', id).single(),
    supabase
      .from('application_notes')
      .select('*')
      .eq('application_id', id)
      .order('created_at', { ascending: false }),
  ])

  if (!app) notFound()

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
          <Card className="space-y-8 p-6">
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
