import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getAdmin } from '@/lib/auth'
import { DEFAULT_SITE_CONTENT, normalizeSiteContent } from '@/lib/site-content'
import { WebsiteEditor } from '@/components/admin/website-editor'

export const metadata: Metadata = { title: 'Website content | CLM Admin' }
export const dynamic = 'force-dynamic'

export default async function WebsiteContentPage() {
  const admin = await getAdmin()
  if (!admin) redirect('/no-access')
  const supabase = await createClient()
  const { data, error } = await supabase.from('clm_site_content').select('content, updated_at').eq('id', 'site').maybeSingle()

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">Website content</h1>
          <p className="mt-1 text-base text-muted-foreground">
            Change the text on the public website. Saved changes appear straight away.
            {data?.updated_at && <> Last saved {new Date(data.updated_at).toLocaleString('en-ZA', { dateStyle: 'medium', timeStyle: 'short' })}.</>}
          </p>
        </div>
        <a href="/" target="_blank" rel="noopener noreferrer" className="inline-flex h-11 items-center rounded-xl border border-border bg-card px-4 text-sm font-semibold hover:bg-muted">
          View website
        </a>
      </div>
      {error || !data ? (
        <div role="alert" className="rounded-2xl border border-destructive/30 bg-destructive/5 p-6 text-destructive">
          <p className="font-semibold">Website content isn&apos;t set up yet.</p>
          <p className="mt-1 text-sm">Run <code className="rounded bg-muted px-1">supabase/20261023_site_content_and_members.sql</code> in the Supabase SQL Editor.</p>
        </div>
      ) : (
        <WebsiteEditor initial={normalizeSiteContent(data.content)} defaults={DEFAULT_SITE_CONTENT} canEdit={admin.role === 'admin'} />
      )}
    </div>
  )
}
