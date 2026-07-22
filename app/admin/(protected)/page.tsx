import Link from 'next/link'
import {
  ArrowUpRight,
  CheckCircle2,
  Clock,
  FileText,
  HelpCircle,
  TrendingUp,
  Users,
  XCircle,
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { StatusBadge } from '@/components/admin/status-badge'
import { ApplicationsTrendChart, GenderPieChart } from '@/components/admin/dashboard-charts'
import { createClient } from '@/lib/supabase/server'

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function buildMonthlyTrend(apps: { created_at: string; status: string }[]) {
  const now = new Date()
  const months = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (6 - i), 1)
    return {
      month: MONTH_NAMES[d.getMonth()],
      year: d.getFullYear(),
      monthNum: d.getMonth(),
      applications: 0,
      approved: 0,
    }
  })
  for (const app of apps) {
    const d = new Date(app.created_at)
    const entry = months.find((m) => m.monthNum === d.getMonth() && m.year === d.getFullYear())
    if (entry) {
      entry.applications++
      if (app.status === 'approved') entry.approved++
    }
  }
  return months.map(({ month, applications, approved }) => ({ month, applications, approved }))
}

function buildGenderDistribution(apps: { gender: string }[]) {
  const counts: Record<string, number> = {}
  for (const app of apps) {
    counts[app.gender] = (counts[app.gender] ?? 0) + 1
  }
  return Object.entries(counts).map(([name, value]) => ({ name, value }))
}

const ACTIVITY_ICON: Record<string, { icon: typeof Clock; tint: string }> = {
  pending:        { icon: Clock,        tint: 'bg-gold/15 text-[color:var(--gold-strong)]' },
  under_review:   { icon: FileText,     tint: 'bg-primary/15 text-primary' },
  approved:       { icon: CheckCircle2, tint: 'bg-success/15 text-success' },
  rejected:       { icon: XCircle,      tint: 'bg-destructive/15 text-destructive' },
  info_requested: { icon: HelpCircle,   tint: 'bg-primary/15 text-primary' },
}

export default async function AdminDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', user!.id)
    .single()

  const firstName = profile?.full_name?.split(' ')[0] ?? 'Admin'

  const [
    { count: pendingCount },
    { count: approvedCount },
    { count: rejectedCount },
    { count: membersCount },
    { data: chartApps },
    { data: recentApplications },
    { data: recentActivity },
  ] = await Promise.all([
    supabase.from('clm_applications').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('clm_applications').select('*', { count: 'exact', head: true }).eq('status', 'approved'),
    supabase.from('clm_applications').select('*', { count: 'exact', head: true }).eq('status', 'rejected'),
    supabase.from('members').select('*', { count: 'exact', head: true }),
    supabase.from('clm_applications').select('created_at, status, gender'),
    supabase.from('clm_applications')
      .select('id, ref, full_name, church_name, status, created_at')
      .order('created_at', { ascending: false })
      .limit(5),
    supabase.from('clm_applications')
      .select('id, full_name, status, updated_at')
      .order('updated_at', { ascending: false })
      .limit(5),
  ])

  const trendData = buildMonthlyTrend(chartApps ?? [])
  const genderData = buildGenderDistribution(chartApps ?? [])
  const totalGender = genderData.reduce((s, g) => s + g.value, 0)

  const statCards = [
    { label: 'Pending review', value: pendingCount ?? 0,  icon: Clock,        tint: 'bg-gold/15 text-[color:var(--gold-strong)]' },
    { label: 'Approved',       value: approvedCount ?? 0, icon: CheckCircle2, tint: 'bg-success/15 text-success' },
    { label: 'Total members',  value: membersCount ?? 0,  icon: Users,        tint: 'bg-primary/15 text-primary' },
    { label: 'Declined',       value: rejectedCount ?? 0, icon: XCircle,      tint: 'bg-destructive/15 text-destructive' },
  ]

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
            Welcome back, {firstName}
          </h1>
          <p className="mt-1 text-base text-muted-foreground">
            Here is what is happening across the movement today.
          </p>
        </div>
        <Link
          href="/admin/applications"
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-base font-semibold text-primary-foreground transition hover:opacity-90"
        >
          Review applications <ArrowUpRight className="size-5" />
        </Link>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map((s) => {
          const Icon = s.icon
          return (
            <Card key={s.label} className="p-5">
              <div className="flex items-center justify-between">
                <span className={`grid size-11 place-items-center rounded-xl ${s.tint}`}>
                  <Icon className="size-6" />
                </span>
              </div>
              <p className="mt-4 font-heading text-3xl font-extrabold text-foreground">{s.value}</p>
              <p className="mt-1 text-base text-muted-foreground">{s.label}</p>
            </Card>
          )
        })}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Trend chart */}
        <Card className="p-6 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="font-heading text-lg font-bold text-foreground">
                Applications over time
              </h2>
              <p className="text-sm text-muted-foreground">Submitted vs approved by month</p>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-success/15 px-3 py-1 text-sm font-semibold text-success">
              <TrendingUp className="size-4" /> Growing
            </span>
          </div>
          <div className="mb-3 flex items-center gap-5 text-sm">
            <span className="flex items-center gap-2 text-muted-foreground">
              <span className="size-3 rounded-full bg-primary" /> Submitted
            </span>
            <span className="flex items-center gap-2 text-muted-foreground">
              <span className="size-3 rounded-full bg-gold" /> Approved
            </span>
          </div>
          <ApplicationsTrendChart data={trendData} />
        </Card>

        {/* Gender donut */}
        <Card className="p-6">
          <h2 className="font-heading text-lg font-bold text-foreground">Applicants by gender</h2>
          <p className="text-sm text-muted-foreground">All submitted applications</p>
          {genderData.length > 0 ? (
            <>
              <GenderPieChart data={genderData} />
              <div className="mt-2 space-y-2">
                {genderData.map((g, i) => (
                  <div key={g.name} className="flex items-center justify-between text-base">
                    <span className="flex items-center gap-2 text-foreground">
                      <span
                        className="size-3 rounded-full"
                        style={{ background: i === 0 ? 'var(--gold)' : 'var(--primary)' }}
                      />
                      {g.name}
                    </span>
                    <span className="font-semibold text-foreground">
                      {totalGender > 0 ? Math.round((g.value / totalGender) * 100) : 0}%
                    </span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Users className="size-10 text-muted-foreground/40" />
              <p className="mt-3 text-sm text-muted-foreground">No data yet.</p>
            </div>
          )}
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Recent applications */}
        <Card className="overflow-hidden lg:col-span-2">
          <div className="flex items-center justify-between border-b border-border px-6 py-4">
            <h2 className="font-heading text-lg font-bold text-foreground">Recent applications</h2>
            <Link
              href="/admin/applications"
              className="text-sm font-semibold text-primary hover:underline"
            >
              View all
            </Link>
          </div>
          {recentApplications && recentApplications.length > 0 ? (
            <ul className="divide-y divide-border">
              {recentApplications.map((a) => (
                <li key={a.id}>
                  <Link
                    href={`/admin/applications/${a.id}`}
                    className="flex items-center gap-4 px-6 py-4 transition hover:bg-muted/50"
                  >
                    <span className="grid size-11 shrink-0 place-items-center rounded-full bg-secondary font-heading text-base font-bold text-primary">
                      {a.full_name.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-foreground">{a.full_name}</p>
                      <p className="truncate text-sm text-muted-foreground">
                        {a.church_name} · {new Date(a.created_at).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                    <StatusBadge status={a.status} />
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <FileText className="size-12 text-muted-foreground/40" />
              <p className="mt-4 text-base font-medium text-muted-foreground">No applications yet.</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Applications will appear here as they come in.
              </p>
            </div>
          )}
        </Card>

        {/* Recent activity */}
        <Card className="p-6">
          <h2 className="font-heading text-lg font-bold text-foreground">Recent activity</h2>
          {recentActivity && recentActivity.length > 0 ? (
            <ul className="mt-4 space-y-4">
              {recentActivity.map((r) => {
                const cfg = ACTIVITY_ICON[r.status] ?? ACTIVITY_ICON.pending
                const Icon = cfg.icon
                return (
                  <li key={r.id} className="flex gap-3">
                    <span className={`grid size-9 shrink-0 place-items-center rounded-full ${cfg.tint}`}>
                      <Icon className="size-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-base font-semibold leading-snug text-foreground">
                        {r.full_name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(r.updated_at).toLocaleDateString('en-ZA', {
                          day: 'numeric',
                          month: 'short',
                        })}
                      </p>
                    </div>
                    <StatusBadge status={r.status} className="shrink-0 self-start" />
                  </li>
                )
              })}
            </ul>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Clock className="size-10 text-muted-foreground/40" />
              <p className="mt-3 text-sm text-muted-foreground">No activity yet.</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
