import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getAdmin } from '@/lib/auth'
import { DEFAULT_FORM_CONFIG, normalizeConfig } from '@/lib/form-config'
import { FormEditor } from '@/components/admin/form-editor'

export const metadata: Metadata = { title: 'Application form | CLM Admin' }
export const dynamic = 'force-dynamic'

const when = (iso: string | null) => (iso ? new Date(iso).toLocaleString('en-ZA', { dateStyle: 'medium', timeStyle: 'short' }) : '')

export default async function FormSettingsPage() {
  const admin = await getAdmin()
  if (!admin) redirect('/no-access')
  const supabase = await createClient()
  const { data, error } = await supabase.from('clm_form_config').select('draft, published, published_at, updated_at').eq('id', 'form').maybeSingle()

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">Application form</h1>
        <p className="mt-1 text-base text-muted-foreground">
          Change the questions on the public application form. Save a draft, preview it, then publish.
          Courses and fees are under Courses &amp; fees; the message after submitting is under Website content.
        </p>
      </div>
      {error || !data ? (
        <div role="alert" className="rounded-2xl border border-destructive/30 bg-destructive/5 p-6 text-destructive">
          <p className="font-semibold">The form editor isn&apos;t set up yet.</p>
          <p className="mt-1 text-sm">Run <code className="rounded bg-muted px-1">supabase/20261112_application_form_config.sql</code> in the Supabase SQL Editor.</p>
        </div>
      ) : (
        <>
          <p className="rounded-xl bg-muted px-4 py-3 text-sm text-muted-foreground">
            {data.published ? <>Live form published {when(data.published_at)}.</> : <>The live form is the original form (nothing published yet).</>}
            {data.draft && <> You have unpublished changes (saved {when(data.updated_at)}).</>}
          </p>
          <FormEditor
            initial={normalizeConfig(data.draft ?? data.published ?? DEFAULT_FORM_CONFIG)}
            hasDraft={!!data.draft}
            canEdit={admin.role === 'admin'}
          />
        </>
      )}
    </div>
  )
}
