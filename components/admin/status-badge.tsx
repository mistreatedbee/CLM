import { CheckCircle2, Clock, HelpCircle, Info, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

// Supports both legacy clm-data statuses and new DB statuses
type Status = string

const CONFIG: Record<string, { className: string; icon: typeof Clock; label: string }> = {
  pending: {
    className: 'bg-gold/15 text-[color:var(--gold-strong)]',
    icon: Clock,
    label: 'Pending',
  },
  under_review: {
    className: 'bg-primary/15 text-primary',
    icon: Info,
    label: 'Under Review',
  },
  approved: {
    className: 'bg-success/15 text-success',
    icon: CheckCircle2,
    label: 'Approved',
  },
  rejected: {
    className: 'bg-destructive/15 text-destructive',
    icon: XCircle,
    label: 'Declined',
  },
  info_requested: {
    className: 'bg-primary/15 text-primary',
    icon: HelpCircle,
    label: 'Info Requested',
  },
  // Legacy aliases
  'info-requested': {
    className: 'bg-primary/15 text-primary',
    icon: HelpCircle,
    label: 'Info Requested',
  },
}

const FALLBACK = {
  className: 'bg-muted text-muted-foreground',
  icon: Clock,
  label: 'Unknown',
}

export function StatusBadge({ status, className }: { status: Status; className?: string }) {
  const { className: styles, icon: Icon, label } = CONFIG[status] ?? FALLBACK
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold',
        styles,
        className,
      )}
    >
      <Icon className="size-4" />
      {label}
    </span>
  )
}
