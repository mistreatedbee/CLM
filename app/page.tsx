import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SiteFooter } from '@/components/site/site-footer'
import { AccessibilityToolbar } from '@/components/accessibility/accessibility-toolbar'

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex flex-1 flex-col items-center justify-center px-4 py-16 text-center">
        <div className="overflow-hidden rounded-3xl border border-border shadow-xl">
          <img
            src="/images/logo.jpeg"
            alt="Christian Leadership Movement"
            className="h-32 w-32 object-cover sm:h-40 sm:w-40"
          />
        </div>

        <h1 className="mt-8 font-heading text-3xl font-extrabold tracking-tight text-balance text-foreground sm:text-4xl md:text-5xl">
          Christian Leadership Movement
        </h1>

        <p className="mt-3 text-lg font-medium text-[color:var(--gold)]">
          Transforming Leaders, Transforming the Nations
        </p>

        <p className="mx-auto mt-5 max-w-md text-base leading-relaxed text-muted-foreground">
          Apply to join CLM and be equipped to lead, disciple, and transform your community.
        </p>

        <Link href="/apply" className="mt-10">
          <Button className="h-16 gap-3 px-10 text-xl font-semibold">
            Start your application <ArrowRight className="size-6" />
          </Button>
        </Link>

        <p className="mt-5 text-sm text-muted-foreground">
          Free to apply · Takes about 15 minutes · Saves automatically
        </p>
      </main>

      <SiteFooter />
      <AccessibilityToolbar />
    </div>
  )
}
