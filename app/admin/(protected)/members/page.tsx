import { createClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/card'
import { Users } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Members | CLM Admin',
}

const LEVEL_COLOURS: Record<string, string> = {
  Trainee: 'bg-gold/15 text-[color:var(--gold-strong)]',
  Deacon:  'bg-primary/15 text-primary',
  Elder:   'bg-success/15 text-success',
  Leader:  'bg-secondary text-foreground',
}

const STATUS_COLOURS: Record<string, string> = {
  active:    'bg-success/15 text-success',
  inactive:  'bg-muted text-muted-foreground',
  suspended: 'bg-destructive/15 text-destructive',
}

export default async function MembersPage() {
  const supabase = await createClient()
  const { data: members } = await supabase
    .from('members')
    .select('*')
    .order('joined_date', { ascending: false })

  const list = members ?? []

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
            Members
          </h1>
          <p className="mt-1 text-base text-muted-foreground">
            {list.length} member{list.length !== 1 ? 's' : ''} registered
          </p>
        </div>
      </div>

      {list.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-20 text-center">
          <Users className="size-12 text-muted-foreground/40" />
          <p className="mt-4 text-base font-medium text-muted-foreground">No members yet.</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Members are added when an application is approved.
          </p>
        </Card>
      ) : (
        <>
          {/* Desktop table */}
          <Card className="hidden overflow-hidden md:block">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/50 text-left text-sm font-semibold text-muted-foreground">
                  <th className="px-6 py-4">Member</th>
                  <th className="px-6 py-4">Number</th>
                  <th className="px-6 py-4">Church</th>
                  <th className="px-6 py-4">Level</th>
                  <th className="px-6 py-4">Joined</th>
                  <th className="px-6 py-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {list.map((m) => (
                  <tr key={m.id} className="hover:bg-muted/40">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-secondary font-heading text-sm font-bold text-primary">
                          {m.full_name.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                        </span>
                        <div>
                          <p className="font-semibold text-foreground">{m.full_name}</p>
                          <p className="text-sm text-muted-foreground">{m.phone}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono text-sm text-muted-foreground">{m.member_number}</td>
                    <td className="px-6 py-4 text-base text-foreground">{m.church}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold ${LEVEL_COLOURS[m.leadership_level] ?? 'bg-muted text-muted-foreground'}`}>
                        {m.leadership_level}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-base text-muted-foreground">
                      {new Date(m.joined_date).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold capitalize ${STATUS_COLOURS[m.status] ?? 'bg-muted'}`}>
                        {m.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>

          {/* Mobile cards */}
          <div className="space-y-3 md:hidden">
            {list.map((m) => (
              <Card key={m.id} className="p-4">
                <div className="flex items-center gap-3">
                  <span className="grid size-11 shrink-0 place-items-center rounded-full bg-secondary font-heading text-sm font-bold text-primary">
                    {m.full_name.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-foreground">{m.full_name}</p>
                    <p className="text-sm text-muted-foreground">{m.church}</p>
                  </div>
                  <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${STATUS_COLOURS[m.status] ?? 'bg-muted'}`}>
                    {m.status}
                  </span>
                </div>
                <div className="mt-3 flex items-center justify-between text-sm text-muted-foreground">
                  <span className="font-mono">{m.member_number}</span>
                  <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${LEVEL_COLOURS[m.leadership_level] ?? 'bg-muted'}`}>
                    {m.leadership_level}
                  </span>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
