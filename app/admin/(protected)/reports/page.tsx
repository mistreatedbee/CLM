import { createClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/card'
import { BarChart3, CheckCircle2, Clock, FileText, HelpCircle, Users, XCircle } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Reports | CLM Admin',
}

function StatRow({ label, value, total }: { label: string; value: number; total: number }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0
  return (
    <div className="flex items-center gap-4 py-3 border-b border-border last:border-0">
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between mb-1">
          <span className="text-base font-medium text-foreground">{label}</span>
          <span className="text-base font-bold text-foreground">{value} <span className="text-sm font-normal text-muted-foreground">({pct}%)</span></span>
        </div>
        <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
          <div className="h-2 rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
        </div>
      </div>
    </div>
  )
}

export default async function ReportsPage() {
  const supabase = await createClient()

  const [
    { data: apps },
    { data: members },
  ] = await Promise.all([
    supabase.from('clm_applications').select('status, gender, course, created_at'),
    supabase.from('members').select('leadership_level, status'),
  ])

  const allApps = apps ?? []
  const allMembers = members ?? []
  const total = allApps.length

  // Applications by status
  const byStatus: Record<string, number> = {}
  for (const a of allApps) byStatus[a.status] = (byStatus[a.status] ?? 0) + 1

  // Applications by gender
  const byGender: Record<string, number> = {}
  for (const a of allApps) byGender[a.gender] = (byGender[a.gender] ?? 0) + 1

  // Applications by course
  const byCourse: Record<string, number> = {}
  for (const a of allApps) {
    const c = a.course ?? 'Not specified'
    byCourse[c] = (byCourse[c] ?? 0) + 1
  }
  const courseEntries = Object.entries(byCourse).sort((a, b) => b[1] - a[1])

  // Applications by month (last 6)
  const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  const now = new Date()
  const monthlyData = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1)
    return { label: `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`, month: d.getMonth(), year: d.getFullYear(), count: 0 }
  })
  for (const a of allApps) {
    const d = new Date(a.created_at)
    const entry = monthlyData.find((m) => m.month === d.getMonth() && m.year === d.getFullYear())
    if (entry) entry.count++
  }
  const maxMonthly = Math.max(...monthlyData.map((m) => m.count), 1)

  // Members by level
  const membersByLevel: Record<string, number> = {}
  for (const m of allMembers) membersByLevel[m.leadership_level] = (membersByLevel[m.leadership_level] ?? 0) + 1

  const statusRows = [
    { key: 'pending',        label: 'Pending review',        icon: Clock },
    { key: 'approved',       label: 'Approved',              icon: CheckCircle2 },
    { key: 'info_requested', label: 'Info requested',        icon: HelpCircle },
    { key: 'rejected',       label: 'Declined',              icon: XCircle },
  ]

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
          Reports
        </h1>
        <p className="mt-1 text-base text-muted-foreground">
          Overview of all applications and members.
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: 'Total applications', value: total,             icon: FileText, tint: 'bg-primary/15 text-primary' },
          { label: 'Approved',           value: byStatus.approved ?? 0, icon: CheckCircle2, tint: 'bg-success/15 text-success' },
          { label: 'Pending',            value: byStatus.pending ?? 0,  icon: Clock, tint: 'bg-gold/15 text-[color:var(--gold-strong)]' },
          { label: 'Total members',      value: allMembers.length,  icon: Users, tint: 'bg-secondary text-foreground' },
        ].map((s) => {
          const Icon = s.icon
          return (
            <Card key={s.label} className="p-5">
              <span className={`grid size-10 place-items-center rounded-xl ${s.tint}`}>
                <Icon className="size-5" />
              </span>
              <p className="mt-4 font-heading text-3xl font-extrabold text-foreground">{s.value}</p>
              <p className="mt-1 text-sm text-muted-foreground">{s.label}</p>
            </Card>
          )
        })}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Applications by status */}
        <Card className="p-6">
          <h2 className="font-heading text-lg font-bold text-foreground mb-4">Applications by status</h2>
          {total === 0 ? (
            <p className="text-sm text-muted-foreground">No applications yet.</p>
          ) : (
            statusRows.map((s) => (
              <StatRow key={s.key} label={s.label} value={byStatus[s.key] ?? 0} total={total} />
            ))
          )}
        </Card>

        {/* Applications by gender */}
        <Card className="p-6">
          <h2 className="font-heading text-lg font-bold text-foreground mb-4">Applications by gender</h2>
          {total === 0 ? (
            <p className="text-sm text-muted-foreground">No applications yet.</p>
          ) : (
            Object.entries(byGender).map(([gender, count]) => (
              <StatRow key={gender} label={gender} value={count} total={total} />
            ))
          )}
        </Card>

        {/* Monthly bar chart */}
        <Card className="p-6 lg:col-span-2">
          <h2 className="font-heading text-lg font-bold text-foreground mb-6">Applications per month</h2>
          {total === 0 ? (
            <p className="text-sm text-muted-foreground">No applications yet.</p>
          ) : (
            <div className="flex items-end gap-3 h-40">
              {monthlyData.map((m) => (
                <div key={m.label} className="flex flex-1 flex-col items-center gap-2">
                  <span className="text-sm font-bold text-foreground">{m.count > 0 ? m.count : ''}</span>
                  <div
                    className="w-full rounded-t-lg bg-primary transition-all"
                    style={{ height: `${Math.max((m.count / maxMonthly) * 120, m.count > 0 ? 8 : 2)}px` }}
                  />
                  <span className="text-xs text-muted-foreground text-center leading-tight">{m.label}</span>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Applications by course */}
        <Card className="p-6">
          <h2 className="font-heading text-lg font-bold text-foreground mb-4">Applications by course</h2>
          {courseEntries.length === 0 ? (
            <p className="text-sm text-muted-foreground">No applications yet.</p>
          ) : (
            courseEntries.map(([course, count]) => (
              <StatRow key={course} label={course} value={count} total={total} />
            ))
          )}
        </Card>

        {/* Members by leadership level */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-heading text-lg font-bold text-foreground">Members by level</h2>
            <span className="text-sm text-muted-foreground">{allMembers.length} total</span>
          </div>
          {allMembers.length === 0 ? (
            <p className="text-sm text-muted-foreground">No members yet.</p>
          ) : (
            ['Trainee', 'Deacon', 'Elder', 'Leader'].map((level) => (
              <StatRow key={level} label={level} value={membersByLevel[level] ?? 0} total={allMembers.length} />
            ))
          )}
        </Card>
      </div>
    </div>
  )
}
