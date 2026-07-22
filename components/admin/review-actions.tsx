'use client'

import { useState } from 'react'
import { CheckCircle2, Clipboard, ClipboardCheck, HelpCircle, MessageSquarePlus, Send, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/admin/status-badge'
import { cn } from '@/lib/utils'
import { statusLabel, type ApplicationStatus } from '@/lib/clm-data'
import { updateApplicationStatus, addApplicationNote } from '@/app/actions/admin'
import type { ApplicationNote } from '@/lib/supabase/types'

function buildQuickResponse(name: string, course?: string) {
  const firstName = name.split(' ')[0]
  const courseText = course ? ` for the **${course}** course` : ''
  return `Dear ${firstName},\n\nThank you for submitting your application to CLM${courseText}. We have received your application and it is currently under review.\n\nOur team will be in touch with you shortly regarding the next steps. Should you have any questions in the meantime, please do not hesitate to contact us.\n\nGod bless you,\nThe CLM Team`
}

export function ReviewActions({
  applicationId,
  initialStatus,
  initialNotes,
  applicantName,
  applicantEmail,
  course,
}: {
  applicationId: string
  initialStatus: ApplicationStatus
  initialNotes: ApplicationNote[]
  applicantName: string
  applicantWhatsapp: string
  course?: string
}) {
  const [status, setStatus] = useState<ApplicationStatus>(initialStatus)
  const [notes, setNotes] = useState<ApplicationNote[]>(initialNotes)
  const [draft, setDraft] = useState('')
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null)
  const [loading, setLoading] = useState(false)
  const [quickResponse, setQuickResponse] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const flash = (msg: string, ok: boolean) => {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 2600)
  }

  const decide = async (next: ApplicationStatus) => {
    setLoading(true)
    const result = await updateApplicationStatus(applicationId, next, '')
    setLoading(false)
    if (result.success) {
      setStatus(next)
      flash(`Application marked as "${statusLabel(next)}".`, true)
    } else {
      flash(result.error, false)
    }
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

  return (
    <div className="space-y-6">
      {toast && (
        <div
          className={cn(
            'rounded-2xl border px-4 py-3 text-base font-medium',
            toast.ok
              ? 'border-success/30 bg-success/10 text-success'
              : 'border-destructive/30 bg-destructive/10 text-destructive',
          )}
          role="status"
        >
          {toast.msg}
        </div>
      )}

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

      <div className="rounded-2xl border border-input bg-card p-5">
        <h3 className="font-heading text-lg font-bold text-foreground">Quick response</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Generate a ready-to-send acknowledgement for this applicant.
        </p>
        <Button
          onClick={() => {
            setQuickResponse(buildQuickResponse(applicantName, course))
            setCopied(false)
          }}
          variant="outline"
          className="mt-4 w-full gap-2"
        >
          <Send className="size-5" /> Generate quick response
        </Button>
        {quickResponse && (
          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>WhatsApp: {applicantWhatsapp}</span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(quickResponse)
                  setCopied(true)
                  setTimeout(() => setCopied(false), 2000)
                }}
                className="flex items-center gap-1.5 rounded-lg px-2 py-1 font-semibold text-primary hover:bg-primary/10"
              >
                {copied ? <ClipboardCheck className="size-4" /> : <Clipboard className="size-4" />}
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <pre className="whitespace-pre-wrap rounded-xl bg-muted/60 p-4 text-sm leading-relaxed text-foreground">
              {quickResponse}
            </pre>
          </div>
        )}
      </div>
    </div>
  )
}
