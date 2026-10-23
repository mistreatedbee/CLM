import type { Metadata } from 'next'
import Link from 'next/link'
import { ClmLogo } from '@/components/clm-logo'
import { ApplicationWizard } from '@/components/apply/application-wizard'
import { getPublicCourses } from '@/lib/courses-server'
import { getSiteContent } from '@/lib/site-content-server'
import { telHref } from '@/lib/site-content'

export const metadata: Metadata = {
  title: 'Apply | Christian Leadership Movement',
  description:
    'Apply to join the Christian Leadership Movement. A simple, guided application you can complete at your own pace.',
}

// Courses and fees are managed in the admin panel; always show the latest.
export const dynamic = 'force-dynamic'

export default async function ApplyPage() {
  const [courses, content] = await Promise.all([getPublicCourses(), getSiteContent()])
  const helpPhone = content.apply.help_phone.trim()
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
          <Link href="/" aria-label="Christian Leadership Movement home">
            <ClmLogo size="md" />
          </Link>
          {helpPhone && (
            <a
              href={telHref(helpPhone)}
              className="text-base font-medium text-muted-foreground hover:text-foreground"
            >
              Need help? Call {helpPhone}
            </a>
          )}
        </div>
      </header>

      <main className="flex-1 px-4 py-10 sm:px-6 sm:py-14">
        <ApplicationWizard courses={courses} confirmation={content.apply} />
      </main>
    </div>
  )
}
