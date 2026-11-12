import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getAdmin } from '@/lib/auth'
import { getPublicCourses } from '@/lib/courses-server'
import { getSiteContent } from '@/lib/site-content-server'
import { getPublishedForm } from '@/lib/form-config-server'
import { normalizeConfig } from '@/lib/form-config'
import { ApplicationWizard } from '@/components/apply/application-wizard'

export const metadata: Metadata = { title: 'Form preview | CLM Admin' }
export const dynamic = 'force-dynamic'

export default async function FormPreviewPage({ searchParams }: { searchParams: Promise<{ version?: string }> }) {
  const { version } = await searchParams
  if (!(await getAdmin())) redirect('/no-access')
  const supabase = await createClient()
  const [courses, content, published, cfg] = await Promise.all([
    getPublicCourses(),
    getSiteContent(),
    getPublishedForm(),
    supabase.from('clm_form_config').select('draft').eq('id', 'form').maybeSingle(),
  ])
  const form = version !== 'published' && cfg.data?.draft ? normalizeConfig(cfg.data.draft) : published

  return (
    <div className="space-y-6">
      <Link href="/admin/form" className="inline-flex items-center gap-1 text-base text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Back to the form editor
      </Link>
      <ApplicationWizard courses={courses} confirmation={content.apply} form={form} preview />
    </div>
  )
}
