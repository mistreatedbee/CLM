'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Download, MessageCircle, Search, SlidersHorizontal } from 'lucide-react'
import { buildWhatsAppUrl, formatWhatsAppNumber } from '@/lib/whatsapp'
import { Card } from '@/components/ui/card'
import { StatusBadge } from '@/components/admin/status-badge'
import { cn } from '@/lib/utils'
import { formatDate, type ApplicationStatus } from '@/lib/clm-data'
import type { ClmApplication } from '@/lib/supabase/types'

const FILTERS: { key: ApplicationStatus | 'all'; label: string }[] = [
  { key: 'all',           label: 'All' },
  { key: 'pending',       label: 'Pending' },
  { key: 'approved',      label: 'Approved' },
  { key: 'info_requested', label: 'Info requested' },
  { key: 'rejected',      label: 'Declined' },
]

export function ApplicationsTable({ applications }: { applications: ClmApplication[] }) {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<ApplicationStatus | 'all'>('all')

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: applications.length }
    for (const a of applications) c[a.status] = (c[a.status] ?? 0) + 1
    return c
  }, [applications])

  const filtered = useMemo(() => {
    return applications
      .filter((a) => (filter === 'all' ? true : a.status === filter))
      .filter((a) =>
        query.trim()
          ? `${a.full_name} ${a.ref} ${a.church_name} ${a.whatsapp ?? ''}`
              .toLowerCase()
              .includes(query.toLowerCase())
          : true,
      )
  }, [query, filter, applications])

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            type="search"
            placeholder="Search by name, reference, or church"
            className="h-12 w-full rounded-xl border border-input bg-card pl-11 pr-4 text-base text-foreground outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
          />
        </div>
        <button className="inline-flex h-12 items-center gap-2 rounded-xl border border-input bg-card px-4 text-base font-medium text-foreground hover:bg-muted">
          <SlidersHorizontal className="size-5" /> Filters
        </button>
        <button className="inline-flex h-12 items-center gap-2 rounded-xl bg-primary px-4 text-base font-semibold text-primary-foreground hover:opacity-90">
          <Download className="size-5" /> Export
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={cn(
              'inline-flex items-center gap-2 rounded-full px-4 py-2 text-base font-medium transition',
              filter === f.key
                ? 'bg-primary text-primary-foreground'
                : 'bg-card text-muted-foreground hover:bg-muted',
            )}
          >
            {f.label}
            <span
              className={cn(
                'rounded-full px-2 py-0.5 text-sm font-semibold',
                filter === f.key ? 'bg-primary-foreground/20' : 'bg-muted',
              )}
            >
              {counts[f.key] ?? 0}
            </span>
          </button>
        ))}
      </div>

      {/* Desktop table */}
      <Card className="hidden overflow-hidden md:block">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-muted/50 text-left text-sm font-semibold text-muted-foreground">
              <th className="px-6 py-4">Applicant</th>
              <th className="px-6 py-4">Reference</th>
              <th className="px-6 py-4">Submitted</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.map((a) => {
              const waNumber = a.whatsapp ?? a.phone
              const waUrl = waNumber
                ? buildWhatsAppUrl(waNumber)
                : null
              return (
              <tr
                key={a.id}
                onClick={() => router.push(`/admin/applications/${a.id}`)}
                className="group cursor-pointer transition hover:bg-muted/40"
              >
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <span className="grid size-10 shrink-0 place-items-center rounded-full bg-secondary font-heading text-sm font-bold text-primary">
                      {a.full_name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                    </span>
                    <div>
                      <p className="font-semibold text-foreground">{a.full_name}</p>
                      <p className="text-sm text-muted-foreground">{waNumber}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 font-mono text-sm text-muted-foreground">{a.ref}</td>
                <td className="px-6 py-4 text-base text-muted-foreground">
                  {formatDate(a.created_at)}
                </td>
                <td className="px-6 py-4">
                  <StatusBadge status={a.status} />
                </td>
                <td className="px-6 py-4 text-right">
                  {waUrl && (
                    <a
                      href={waUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      title={`Open WhatsApp for ${a.full_name}`}
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-1 rounded-lg px-2.5 py-2 text-sm font-semibold text-[#25D366] hover:bg-[#25D366]/10"
                    >
                      <MessageCircle className="size-4" />
                    </a>
                  )}
                </td>
              </tr>
              )
            })}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <p className="px-6 py-12 text-center text-base text-muted-foreground">
            No applications match your search.
          </p>
        )}
      </Card>

      {/* Mobile cards */}
      <div className="space-y-3 md:hidden">
        {filtered.map((a) => (
          <Link key={a.id} href={`/admin/applications/${a.id}`}>
            <Card className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="grid size-11 shrink-0 place-items-center rounded-full bg-secondary font-heading text-sm font-bold text-primary">
                    {a.full_name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                  </span>
                  <div>
                    <p className="font-semibold text-foreground">{a.full_name}</p>
                    <p className="text-sm text-muted-foreground">{a.church_name}</p>
                  </div>
                </div>
                <StatusBadge status={a.status} />
              </div>
              <div className="mt-3 flex items-center justify-between text-sm text-muted-foreground">
                <span className="font-mono">{a.ref}</span>
                <span>{formatDate(a.created_at)}</span>
              </div>
            </Card>
          </Link>
        ))}
        {filtered.length === 0 && (
          <p className="py-8 text-center text-base text-muted-foreground">
            No applications match your search.
          </p>
        )}
      </div>
    </div>
  )
}
