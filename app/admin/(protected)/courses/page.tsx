import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getAdmin } from '@/lib/auth'
import { CoursesManager, type CourseWithPrices } from '@/components/admin/courses-manager'

export const metadata: Metadata = { title: 'Courses & fees | CLM Admin' }
export const dynamic = 'force-dynamic'

export default async function CoursesPage() {
  const admin = await getAdmin()
  if (!admin) redirect('/no-access')
  const supabase = await createClient()

  const [coursesRes, pricesRes, appsRes] = await Promise.all([
    supabase.from('clm_courses').select('*').order('sort_order').order('name'),
    supabase.from('clm_course_prices').select('*').order('effective_from', { ascending: false }),
    supabase.from('clm_applications').select('course_id').not('course_id', 'is', null),
  ])

  const error = coursesRes.error ?? pricesRes.error
  const applications = new Map<string, number>()
  for (const a of appsRes.data ?? []) {
    if (a.course_id) applications.set(a.course_id, (applications.get(a.course_id) ?? 0) + 1)
  }
  const courses: CourseWithPrices[] = (coursesRes.data ?? []).map((c) => ({
    ...c,
    prices: (pricesRes.data ?? []).filter((p) => p.course_id === c.id),
    application_count: applications.get(c.id) ?? 0,
  }))

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
          Courses &amp; fees
        </h1>
        <p className="mt-1 text-base text-muted-foreground">
          Active courses appear on the website and the application form with their current fees.
          Changes show immediately. Applicants keep the fees they were quoted when they applied.
        </p>
      </div>

      {error ? (
        <div role="alert" className="rounded-2xl border border-destructive/30 bg-destructive/5 p-6 text-destructive">
          <p className="font-semibold">Couldn&apos;t load courses.</p>
          <p className="mt-1 text-sm">
            {error.message}. If this mentions a missing table, run
            <code className="mx-1 rounded bg-muted px-1">supabase/20261014_courses_and_pricing.sql</code>
            in the Supabase SQL Editor.
          </p>
        </div>
      ) : (
        <CoursesManager courses={courses} canEdit={admin.role === 'admin'} />
      )}
    </div>
  )
}
