import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { getAdmin } from '@/lib/auth'
import { MembersManager, type MemberRow } from '@/components/admin/members-manager'

export const metadata: Metadata = {
  title: 'Members | CLM Admin',
}

export const dynamic = 'force-dynamic'

export default async function MembersPage() {
  if (!(await getAdmin())) redirect('/no-access')
  const supabase = await createClient()
  const { data: members, error } = await supabase
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

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
          Members
        </h1>
        <p className="mt-1 text-base text-muted-foreground">
          Approved applicants join automatically. You can also add members by hand, update their details,
          level and status, and keep notes.
        </p>
      </div>
      {error ? (
        <div role="alert" className="rounded-2xl border border-destructive/30 bg-destructive/5 p-6 text-destructive">
          <p className="font-semibold">Couldn&apos;t load members.</p>
          <p className="mt-1 text-sm">
            {error.message}. If this says &ldquo;permission denied for table users&rdquo;, run
            <code className="mx-1 rounded bg-muted px-1">supabase/20261023_site_content_and_members.sql</code>
            in the Supabase SQL Editor.
          </p>
        </div>
      ) : (
        <MembersManager members={(members ?? []) as unknown as MemberRow[]} />
      )}
    </div>
  )
}
