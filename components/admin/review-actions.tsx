'use client'

import { useMemo, useState } from 'react'
import {
  CheckCircle2,
  Clipboard,
  ClipboardCheck,
  Clock,
  ExternalLink,
  HelpCircle,
  MessageCircle,
  MessageSquarePlus,
  Phone,
  Send,
  XCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/admin/status-badge'
import { cn } from '@/lib/utils'
import { formatDateTime, statusLabel, type ApplicationStatus } from '@/lib/clm-data'
import { updateApplicationStatus, addApplicationNote } from '@/app/actions/admin'
import { logWhatsAppMessage } from '@/app/actions/whatsapp'
import { buildWhatsAppUrl, replacePlaceholders, isValidWhatsAppNumber } from '@/lib/whatsapp'
import type { ApplicationNote, WhatsAppLog, WhatsAppTemplate, WhatsAppSettings } from '@/lib/supabase/types'

const TRIGGER_LABEL: Record<string, string> = {
  submission:       'Submission',
  approved:         'Approved',
  rejected:         'Rejected',
  info_requested:   'Info Requested',
  manual:           'Manual',
  auto_approved:    'Auto — Approved',
  auto_rejected:    'Auto — Rejected',
  auto_submission:  'Auto — Submission',
}

export function ReviewActions({
  applicationId,
  initialStatus,
  initialNotes,
  applicantName,
  applicantWhatsapp,
  submissionDate,
  initialWaLogs,
  waTemplates,
  waSettings,
}: {
  applicationId: string
  initialStatus: ApplicationStatus
  initialNotes: ApplicationNote[]
  applicantName: string
  applicantWhatsapp: string
  submissionDate: string
  initialWaLogs: WhatsAppLog[]
  waTemplates: WhatsAppTemplate[]
  waSettings: WhatsAppSettings | null
}) {
  const [status, setStatus] = useState<ApplicationStatus>(initialStatus)
  const [notes, setNotes] = useState<ApplicationNote[]>(initialNotes)
  const [draft, setDraft] = useState('')
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null)
  const [loading, setLoading] = useState(false)
  const [waLogs, setWaLogs] = useState<WhatsAppLog[]>(initialWaLogs)
  const [copied, setCopied] = useState(false)
  const [expandedLog, setExpandedLog] = useState<string | null>(null)

  // Pre-select the template that matches the current status
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(() => {
    const match = waTemplates.find((t) => t.trigger_type === initialStatus && t.active)
    return match?.id ?? waTemplates.find((t) => t.active)?.id ?? ''
  })

  const flash = (msg: string, ok: boolean) => {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 3000)
  }

  const messageCtx = useMemo(
    () => ({
      applicantName,
      applicationId,
      applicationStatus: statusLabel(status),
      submissionDate,
    }),
    [applicantName, applicationId, status, submissionDate],
  )

  const messagePreview = useMemo(() => {
    const template = waTemplates.find((t) => t.id === selectedTemplateId)
    if (!template) return null
    return replacePlaceholders(template.body, messageCtx)
  }, [selectedTemplateId, waTemplates, messageCtx])

  const decide = async (next: ApplicationStatus) => {
    setLoading(true)
    const result = await updateApplicationStatus(applicationId, next, applicantName)
    setLoading(false)

    if (result.success) {
      setStatus(next)

      // Switch template selector to match the new status
      const matchingTemplate = waTemplates.find((t) => t.trigger_type === next && t.active)
      if (matchingTemplate) setSelectedTemplateId(matchingTemplate.id)

      if (result.whatsappAction) {
        // Auto-send: open WA and add optimistic log entry
        window.open(result.whatsappAction.url, '_blank')
        setWaLogs((prev) => [
          {
            id: `opt-${Date.now()}`,
            application_id: applicationId,
            applicant_name: applicantName,
            whatsapp_number: applicantWhatsapp,
            template_id: null,
            template_name: result.whatsappAction!.templateName,
            message_body: result.whatsappAction!.message,
            trigger_type: `auto_${next}`,
            sent_by: 'system',
            sent_at: new Date().toISOString(),
          },
          ...prev,
        ])
        flash(
          `Marked as "${statusLabel(next)}" — WhatsApp opened for ${applicantName.split(' ')[0]}.`,
          true,
        )
      } else {
        flash(`Application marked as "${statusLabel(next)}".`, true)
      }
    } else {
      flash(result.error, false)
    }
  }

  const openWhatsApp = async () => {
    if (!applicantWhatsapp) {
      flash('No WhatsApp number on this application.', false)
      return
    }
    if (!isValidWhatsAppNumber(applicantWhatsapp)) {
      flash('WhatsApp number appears invalid. Check the applicant\'s profile.', false)
      return
    }
    if (!messagePreview) {
      flash('Select a message template first.', false)
      return
    }

    const template = waTemplates.find((t) => t.id === selectedTemplateId)
    const url = buildWhatsAppUrl(applicantWhatsapp, messagePreview)
    window.open(url, '_blank')

    await logWhatsAppMessage({
      applicationId,
      applicantName,
      whatsappNumber: applicantWhatsapp,
      templateId: template?.id ?? null,
      templateName: template?.name ?? null,
      messageBody: messagePreview,
      triggerType: 'manual',
      sentBy: 'admin',
    })

    setWaLogs((prev) => [
      {
        id: `opt-${Date.now()}`,
        application_id: applicationId,
        applicant_name: applicantName,
        whatsapp_number: applicantWhatsapp,
        template_id: template?.id ?? null,
        template_name: template?.name ?? null,
        message_body: messagePreview,
        trigger_type: 'manual',
        sent_by: 'admin',
        sent_at: new Date().toISOString(),
      },
      ...prev,
    ])

    flash('WhatsApp opened with pre-filled message.', true)
  }

  const submitNote = async () => {
    if (!draft.trim()) return
    const text = draft.trim()
    setLoading(true)
    const result = await addApplicationNote(applicationId, text)
    setLoading(false)
    if (result.success) {
      setDraft('')
      setNotes((prev) => [
        {
          id: `opt-${Date.now()}`,
          application_id: applicationId,
          author_id: null,
          author_name: 'You',
          text,
          created_at: new Date().toISOString(),
        },
        ...prev,
      ])
      flash('Note added.', true)
    } else {
      flash(result.error, false)
    }
  }

  const hasWhatsApp = !!applicantWhatsapp && isValidWhatsAppNumber(applicantWhatsapp)

  return (
    <div className="space-y-6">
      {toast && (
        <div
          role="status"
          className={cn(
            'rounded-2xl border px-4 py-3 text-base font-medium',
            toast.ok
              ? 'border-success/30 bg-success/10 text-success'
              : 'border-destructive/30 bg-destructive/10 text-destructive',
          )}
        >
          {toast.msg}
        </div>
      )}

      {/* Decision */}
      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-heading text-lg font-bold text-foreground">Decision</h3>
          <StatusBadge status={status} />
        </div>
        <div className="grid grid-cols-1 gap-3">
          <Button
            onClick={() => decide('approved')}
            disabled={loading}
            className={cn(
              'h-13 justify-start gap-3 bg-success py-3 text-base font-semibold text-success-foreground hover:bg-success/90',
              status === 'approved' && 'ring-2 ring-success ring-offset-2 ring-offset-card',
            )}
          >
            <CheckCircle2 className="size-5" /> Approve application
          </Button>
          <Button
            onClick={() => decide('under_review')}
            disabled={loading}
            variant="outline"
            className="h-13 justify-start gap-3 py-3 text-base font-semibold"
          >
            <Clock className="size-5 text-muted-foreground" /> Mark as under review
          </Button>
          <Button
            onClick={() => decide('info_requested')}
            disabled={loading}
            variant="outline"
            className="h-13 justify-start gap-3 py-3 text-base font-semibold"
          >
            <HelpCircle className="size-5 text-primary" /> Request more information
          </Button>
          <Button
            onClick={() => decide('rejected')}
            disabled={loading}
            variant="outline"
            className="h-13 justify-start gap-3 border-destructive/30 py-3 text-base font-semibold text-destructive hover:bg-destructive/10"
          >
            <XCircle className="size-5" /> Decline application
          </Button>
        </div>
      </div>

      {/* WhatsApp communication */}
      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="mb-4 flex items-center gap-2">
          <MessageCircle className="size-5 text-[#25D366]" />
          <h3 className="font-heading text-lg font-bold text-foreground">WhatsApp</h3>
          {waSettings && (
            <span className="ml-auto rounded-full bg-muted px-2.5 py-0.5 text-xs font-semibold text-muted-foreground">
              {waSettings.auto_send_on_approval || waSettings.auto_send_on_rejection
                ? 'Auto-send on'
                : 'Auto-send off'}
            </span>
          )}
        </div>

        {/* Number display */}
        <div className="mb-4 flex items-center gap-3 rounded-xl bg-muted/50 px-4 py-3">
          <Phone className="size-4 shrink-0 text-muted-foreground" />
          {hasWhatsApp ? (
            <span className="flex-1 text-base font-medium text-foreground">{applicantWhatsapp}</span>
          ) : (
            <span className="flex-1 text-base text-muted-foreground">No valid WhatsApp number</span>
          )}
          {hasWhatsApp && (
            <a
              href={buildWhatsAppUrl(applicantWhatsapp)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-sm font-semibold text-[#25D366] hover:underline"
            >
              Open <ExternalLink className="size-3.5" />
            </a>
          )}
        </div>

        {waTemplates.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No templates configured.{' '}
            <a href="/admin/whatsapp" className="font-semibold text-primary hover:underline">
              Set up templates →
            </a>
          </p>
        ) : (
          <>
            {/* Template selector */}
            <div className="mb-3">
              <label className="mb-1.5 block text-sm font-semibold text-muted-foreground">
                Message template
              </label>
              <select
                value={selectedTemplateId}
                onChange={(e) => setSelectedTemplateId(e.target.value)}
                className="h-11 w-full rounded-xl border border-input bg-background px-3 text-base text-foreground outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
              >
                <option value="">— Select template —</option>
                {waTemplates.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Message preview */}
            {messagePreview && (
              <div className="mb-4 space-y-2">
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>Message preview</span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(messagePreview)
                      setCopied(true)
                      setTimeout(() => setCopied(false), 2000)
                    }}
                    className="flex items-center gap-1.5 rounded-lg px-2 py-1 font-semibold text-primary hover:bg-primary/10"
                  >
                    {copied ? (
                      <ClipboardCheck className="size-4" />
                    ) : (
                      <Clipboard className="size-4" />
                    )}
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                </div>
                <pre className="max-h-52 overflow-y-auto whitespace-pre-wrap rounded-xl bg-muted/60 p-4 text-sm leading-relaxed text-foreground">
                  {messagePreview}
                </pre>
              </div>
            )}

            {/* Open WhatsApp button */}
            <Button
              onClick={openWhatsApp}
              disabled={!hasWhatsApp || !messagePreview || loading}
              className="w-full gap-2 bg-[#25D366] text-white hover:bg-[#1ebe5d]"
            >
              <Send className="size-4" /> Open WhatsApp with message
            </Button>
            {hasWhatsApp && (
              <p className="mt-2 text-center text-xs text-muted-foreground">
                WhatsApp will open with the message pre-filled — just press Send.
              </p>
            )}
          </>
        )}
      </div>

      {/* Internal notes */}
      <div className="rounded-2xl border border-border bg-card p-5">
        <h3 className="font-heading text-lg font-bold text-foreground">Internal notes</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Only visible to reviewers, never to the applicant.
        </p>
        <div className="mt-4">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={3}
            placeholder="Add a note about this candidate..."
            className="w-full resize-none rounded-xl border border-input bg-background p-3 text-base text-foreground outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
          />
          <Button
            onClick={submitNote}
            disabled={!draft.trim() || loading}
            className="mt-3 gap-2"
          >
            <MessageSquarePlus className="size-5" /> Add note
          </Button>
        </div>

        <ul className="mt-5 space-y-3">
          {notes.length === 0 && (
            <li className="text-base text-muted-foreground">No notes yet.</li>
          )}
          {notes.map((n) => (
            <li key={n.id} className="rounded-xl bg-muted/60 p-4">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-foreground">{n.author_name}</span>
                <span className="text-sm text-muted-foreground">
                  {new Date(n.created_at).toLocaleDateString('en-ZA', {
                    day: 'numeric',
                    month: 'short',
                  })}
                </span>
              </div>
              <p className="mt-1 text-base leading-relaxed text-foreground">{n.text}</p>
            </li>
          ))}
        </ul>
      </div>

      {/* Communication history */}
      {waLogs.length > 0 && (
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="mb-4 flex items-center gap-2">
            <Clock className="size-4 text-muted-foreground" />
            <h3 className="font-heading text-lg font-bold text-foreground">Communication history</h3>
          </div>
          <ul className="space-y-3">
            {waLogs.slice(0, 8).map((log) => (
              <li key={log.id} className="rounded-xl border border-border p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <span className="text-sm font-semibold text-foreground">
                      {log.template_name ?? 'Custom message'}
                    </span>
                    <div className="mt-0.5 flex items-center gap-2">
                      <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                        {TRIGGER_LABEL[log.trigger_type] ?? log.trigger_type}
                      </span>
                      <span className="text-xs text-muted-foreground">by {log.sent_by}</span>
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {formatDateTime(log.sent_at)}
                  </span>
                </div>
                <button
                  onClick={() =>
                    setExpandedLog(expandedLog === log.id ? null : log.id)
                  }
                  className="mt-2 text-xs font-semibold text-primary hover:underline"
                >
                  {expandedLog === log.id ? 'Hide message' : 'View message'}
                </button>
                {expandedLog === log.id && (
                  <pre className="mt-2 whitespace-pre-wrap rounded-lg bg-muted/60 p-3 text-xs leading-relaxed text-foreground">
                    {log.message_body}
                  </pre>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
