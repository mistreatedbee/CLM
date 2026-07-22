import type { ApplicationStatus } from '@/lib/supabase/types'

export type { ApplicationStatus }

export function statusLabel(status: ApplicationStatus): string {
  switch (status) {
    case 'pending':        return 'Pending'
    case 'under_review':   return 'Under Review'
    case 'approved':       return 'Approved'
    case 'rejected':       return 'Rejected'
    case 'info_requested': return 'Info Requested'
  }
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-ZA', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('en-ZA', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
