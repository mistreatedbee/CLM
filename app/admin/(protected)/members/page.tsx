import { createClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/card'
import { Layers, ExternalLink, Users } from 'lucide-react'
import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Members | CLM Admin',
}

const LEVEL_ORDER = ['Trainee', 'Deacon', 'Elder', 'Leader']

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

function Detail({ label, value }: { label: string; value: string | boolean | null | undefined }) {
  if (value === null || value === undefined || value === '') return null
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</span>
      <span className="text-sm text-foreground">
        {typeof value === 'boolean' ? (value ? 'Yes' : 'No') : value}
      </span>
    </div>
  )
}

export default async function MembersPage() {
  const supabase = await createClient()
  const { data: members } = await supabase
    .from('members')
    .select(`
      *,
      application:clm_applications (
        id, ref, id_number, gender, marital_status,
        whatsapp, phone, physical_address, country,
        accepted_christ_date, baptized, attends_church,
        church_name, church_denomination, pastor_name,
        serves_ministry, ministry_detail,
        reason_joining, leadership_experience, spiritual_gifts, growth_areas,
        called_to_leadership, leadership_vision_explanation, long_term_vision,
        reference_name, reference_phone, reference_relationship,
        created_at
      )
    `)
    .order('joined_date', { ascending: false })

  const list = members ?? []

  // Group by leadership level
  const grouped = new Map<string, typeof list>()
  for (const m of list) {
    const key = m.leadership_level || 'Trainee'
    if (!grouped.has(key)) grouped.set(key, [])
    grouped.get(key)!.push(m)
  }

  const sortedGroups = [...grouped.entries()].sort(
    ([a], [b]) => LEVEL_ORDER.indexOf(a) - LEVEL_ORDER.indexOf(b),
  )

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
            Members
          </h1>
          <p className="mt-1 text-base text-muted-foreground">
            {list.length} member{list.length !== 1 ? 's' : ''} across{' '}
            {sortedGroups.length} leadership level{sortedGroups.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {list.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-20 text-center">
          <Users className="size-12 text-muted-foreground/40" />
          <p className="mt-4 text-base font-medium text-muted-foreground">No members yet.</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Members are added automatically when an application is approved.
          </p>
        </Card>
      ) : (
        <div className="space-y-10">
          {sortedGroups.map(([level, levelMembers]) => (
            <section key={level}>
              <div className="mb-4 flex items-center gap-3">
                <div className="grid size-9 place-items-center rounded-xl bg-primary/10">
                  <Layers className="size-5 text-primary" />
                </div>
                <div>
                  <h2 className="font-heading text-lg font-bold text-foreground">{level}</h2>
                  <p className="text-sm text-muted-foreground">
                    {levelMembers.length} member{levelMembers.length !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {levelMembers.map((m) => {
                  type AppData = {
                    id: string; ref: string; id_number?: string;
                    gender?: string; marital_status?: string; whatsapp?: string;
                    phone?: string; physical_address?: string; country?: string;
                    accepted_christ_date?: string; baptized?: boolean;
                    attends_church?: boolean; church_name?: string;
                    church_denomination?: string; pastor_name?: string;
                    serves_ministry?: boolean; ministry_detail?: string;
                    reason_joining?: string; leadership_experience?: string;
                    spiritual_gifts?: string; growth_areas?: string;
                    called_to_leadership?: boolean; leadership_vision_explanation?: string;
                    long_term_vision?: string; reference_name?: string;
                    reference_phone?: string; reference_relationship?: string;
                    created_at?: string;
                  }
                  const app = m.application as AppData | null
                  const initials = m.full_name
                    .split(' ')
                    .map((n: string) => n[0])
                    .join('')
                    .slice(0, 2)

                  return (
                    <Card key={m.id} className="overflow-hidden">
                      {/* Member header */}
                      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border p-5">
                        <div className="flex items-center gap-3">
                          <span className="grid size-11 shrink-0 place-items-center rounded-full bg-secondary font-heading text-sm font-bold text-primary">
                            {initials}
                          </span>
                          <div>
                            <p className="font-heading text-base font-bold text-foreground">
                              {m.full_name}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {m.member_number} · Joined{' '}
                              {new Date(m.joined_date).toLocaleDateString('en-ZA', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              })}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold ${LEVEL_COLOURS[m.leadership_level] ?? 'bg-muted text-muted-foreground'}`}
                          >
                            {m.leadership_level}
                          </span>
                          <span
                            className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold capitalize ${STATUS_COLOURS[m.status] ?? 'bg-muted'}`}
                          >
                            {m.status}
                          </span>
                          {app?.id && (
                            <Link
                              href={`/admin/applications/${app.id}`}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm font-semibold text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                            >
                              View Application
                              <ExternalLink className="size-3.5" />
                            </Link>
                          )}
                        </div>
                      </div>

                      {/* Detail grid */}
                      <div className="divide-y divide-border">
                        {/* Personal information */}
                        <div className="px-5 py-4">
                          <p className="mb-3 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                            Personal Information
                          </p>
                          <div className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-3 lg:grid-cols-4">
                            <Detail label="Full Name" value={m.full_name} />
                            <Detail label="ID Number" value={app?.id_number} />
                            <Detail label="Gender" value={app?.gender} />
                            <Detail label="Marital Status" value={app?.marital_status} />
                            <Detail label="WhatsApp" value={app?.whatsapp ?? m.phone} />
                            <Detail label="Phone" value={app?.phone} />
                            <Detail label="Email" value={m.email} />
                            <Detail label="Country" value={app?.country} />
                            <Detail label="Address" value={app?.physical_address} />
                          </div>
                        </div>

                        {/* Spiritual background */}
                        <div className="px-5 py-4">
                          <p className="mb-3 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                            Spiritual Background
                          </p>
                          <div className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-3 lg:grid-cols-4">
                            <Detail label="Church" value={m.church} />
                            <Detail label="Denomination" value={app?.church_denomination} />
                            <Detail label="Pastor / Leader" value={app?.pastor_name} />
                            <Detail label="Accepted Christ" value={app?.accepted_christ_date} />
                            <Detail label="Baptized" value={app?.baptized} />
                            <Detail label="Attends Church" value={app?.attends_church} />
                            <Detail label="Serves in Ministry" value={app?.serves_ministry} />
                            {app?.ministry_detail && (
                              <Detail label="Ministry Details" value={app.ministry_detail} />
                            )}
                          </div>
                        </div>

                        {/* Leadership & Vision */}
                        <div className="px-5 py-4">
                          <p className="mb-3 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                            Leadership &amp; Vision
                          </p>
                          <div className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
                            <Detail label="Why Joining CLM" value={app?.reason_joining} />
                            <Detail label="Leadership Experience" value={app?.leadership_experience} />
                            <Detail label="Spiritual Gifts" value={app?.spiritual_gifts} />
                            <Detail label="Growth Areas" value={app?.growth_areas} />
                            <Detail label="Called to Leadership" value={app?.called_to_leadership} />
                            <Detail label="Long-Term Vision" value={app?.long_term_vision} />
                          </div>
                        </div>

                        {/* Reference */}
                        <div className="px-5 py-4">
                          <p className="mb-3 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                            Reference
                          </p>
                          <div className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-3">
                            <Detail label="Reference Name" value={app?.reference_name} />
                            <Detail label="Reference Phone" value={app?.reference_phone} />
                            <Detail label="Relationship" value={app?.reference_relationship} />
                          </div>
                        </div>
                      </div>
                    </Card>
                  )
                })}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}
