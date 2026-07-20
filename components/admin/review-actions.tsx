'use client'

import { useState } from 'react'
import { CheckCircle2, HelpCircle, MessageSquarePlus, Send, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/admin/status-badge'
import { cn } from '@/lib/utils'
import { statusLabel, type ApplicationStatus } from '@/lib/clm-data'

type Note = { id: string; author: string; text: string; date: string }

export function ReviewActions({
  initialStatus,
  initialNotes,
}: {
  initialStatus: ApplicationStatus
  initialNotes: Note[]
}) {
  const [status, setStatus] = useState<ApplicationStatus>(initialStatus)
  const [notes, setNotes] = useState<Note[]>(initialNotes)
  const [draft, setDraft] = useState('')
  const [toast, setToast] = useState<string | null>(null)

  const flash = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 2600)
  }

  const decide = (next: ApplicationStatus) => {
    setStatus(next)
    flash(`Application marked as “${statusLabel(next)}”. The applicant has been notified.`)
  }

  const addNote = () => {
    if (!draft.trim()) return
    setNotes((n) => [
      {
        id: `n${Date.now()}`,
        author: 'Thabo Mokoena',
        text: draft.trim(),
        date: new Date().toISOString(),
      },
      ...n,
    ])
    setDraft('')
    flash('Internal note added.')
  }

  return (
    <div className="space-y-6">
      {toast && (
        <div
          className="rounded-2xl border border-success/30 bg-success/10 px-4 py-3 text-base font-medium text-success"
          role="status"
        >
          {toast}
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
            className={cn(
              'h-13 justify-start gap-3 bg-success py-3 text-base font-semibold text-success-foreground hover:bg-success/90',
              status === 'approved' && 'ring-2 ring-success ring-offset-2 ring-offset-card',
            )}
          >
            <CheckCircle2 className="size-5" /> Approve application
          </Button>
          <Button
            onClick={() => decide('info-requested')}
            variant="outline"
            className="h-13 justify-start gap-3 py-3 text-base font-semibold"
          >
            <HelpCircle className="size-5 text-primary" /> Request more information
          </Button>
          <Button
            onClick={() => decide('rejected')}
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
          <Button onClick={addNote} disabled={!draft.trim()} className="mt-3 gap-2">
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
                <span className="font-semibold text-foreground">{n.author}</span>
                <span className="text-sm text-muted-foreground">
                  {new Date(n.date).toLocaleDateString('en-ZA', {
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

      <button className="flex w-full items-center justify-center gap-2 rounded-2xl border border-input bg-card py-3 text-base font-semibold text-foreground hover:bg-muted">
        <Send className="size-5" /> Email the applicant
      </button>
    </div>
  )
}
