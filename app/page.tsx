import Link from 'next/link'
import {
  ArrowRight,
  BookOpen,
  GraduationCap,
  HandHeart,
  Sparkles,
  Users,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SiteFooter } from '@/components/site/site-footer'
import { AccessibilityToolbar } from '@/components/accessibility/accessibility-toolbar'
import { getPublicCourses } from '@/lib/courses-server'
import { formatMoney, studyModeLabel } from '@/lib/courses'
import { getSiteContent } from '@/lib/site-content-server'
import { AnnouncementBar } from '@/components/site/announcement-bar'

// Courses and fees come from the admin panel; render with the latest values.
export const dynamic = 'force-dynamic'

const WHY_JOIN_ICONS = [GraduationCap, Users, HandHeart, BookOpen]

export default async function HomePage() {
  const [courses, content] = await Promise.all([getPublicCourses(), getSiteContent()])
  const { hero, why_join: whyJoin, courses_section: coursesSection } = content
  return (
    <div className="flex min-h-screen flex-col">
      <AnnouncementBar announcement={content.announcement} />
      {/* ── Hero ── */}
      <main className="relative flex flex-col items-center overflow-hidden bg-background px-4 pb-24 pt-20 text-center">
        {/* subtle radial glow behind hero */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[520px] bg-[radial-gradient(ellipse_80%_60%_at_50%_0%,rgba(12,26,99,0.12),transparent)]"
        />

        {/* badge */}
        {hero.badge.trim() && (
          <span className="mb-8 inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-sm font-medium text-muted-foreground shadow-sm">
            <Sparkles className="size-4 text-[color:var(--gold)]" />
            {hero.badge}
          </span>
        )}

        {/* logo */}
        <div className="overflow-hidden rounded-[2rem] border border-border shadow-2xl ring-4 ring-primary/10">
          <img
            src="/images/logo.jpeg"
            alt="Christian Leadership Movement"
            className="h-36 w-36 object-cover sm:h-44 sm:w-44"
          />
        </div>

        {/* heading */}
        <h1 className="mt-8 max-w-2xl font-heading text-4xl font-extrabold leading-tight tracking-tight text-foreground sm:text-5xl md:text-6xl">
          {hero.title_main}{' '}
          <span className="text-primary">{hero.title_accent}</span>
        </h1>

        <p className="mt-4 text-lg font-semibold text-[color:var(--gold)] sm:text-xl">
          {hero.tagline}
        </p>

        <p className="mx-auto mt-5 max-w-lg text-base leading-relaxed text-muted-foreground">
          {hero.description}
        </p>

        <Link href="/apply" className="mt-10">
          <Button size="lg" className="h-16 gap-3 px-12 text-xl font-bold shadow-lg shadow-primary/25">
            {hero.button_label} <ArrowRight className="size-6" />
          </Button>
        </Link>

        <p className="mt-5 text-sm text-muted-foreground">
          {hero.small_print}
        </p>
      </main>

      {/* ── Courses (managed in Admin > Courses & fees) ── */}
      {coursesSection.enabled && courses.length > 0 && (
        <section className="px-4 py-20 sm:px-6" aria-labelledby="courses-heading">
          <div className="mx-auto max-w-5xl">
            <div className="mb-12 text-center">
              <h2 id="courses-heading" className="font-heading text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
                {coursesSection.title}
              </h2>
              {coursesSection.subtitle && (
                <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-muted-foreground">
                  {coursesSection.subtitle}
                </p>
              )}
            </div>
            <div className="grid gap-6 md:grid-cols-3">
              {courses.map((c) => (
                <div key={c.id} className="flex flex-col rounded-2xl border border-border bg-card p-7 shadow-sm">
                  <h3 className="font-heading text-xl font-bold text-foreground">{c.name}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {[c.duration, studyModeLabel(c.study_mode)].filter(Boolean).join(' · ')}
                  </p>
                  {c.description && <p className="mt-3 text-base leading-relaxed text-muted-foreground">{c.description}</p>}
                  <div className="mt-auto pt-5 text-base text-foreground">
                    {c.price ? (
                      <>
                        <p>Registration fee: <strong>{formatMoney(c.price.registration_fee, c.price.currency)}</strong></p>
                        <p>Course: <strong>{formatMoney(c.price.course_fee, c.price.currency)}</strong></p>
                      </>
                    ) : (
                      <p className="text-muted-foreground">Fees to be confirmed</p>
                    )}
                    {!c.open_for_applications && <p className="mt-2 text-sm font-semibold text-muted-foreground">Applications currently closed</p>}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-10 text-center">
              <Link href="/apply">
                <Button className="gap-2 px-8">Register now <ArrowRight className="size-4" /></Button>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ── Why Join ── */}
      {whyJoin.enabled && (
      <section className="bg-secondary/50 px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-5xl">
          <div className="mb-14 text-center">
            <h2 className="font-heading text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
              {whyJoin.title}
            </h2>
            {whyJoin.intro && (
              <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-muted-foreground">
                {whyJoin.intro}
              </p>
            )}
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            {whyJoin.items.map(({ title, text }, i) => {
              const Icon = WHY_JOIN_ICONS[i % WHY_JOIN_ICONS.length]
              return (
              <div
                key={`${i}-${title}`}
                className="flex gap-5 rounded-2xl border border-border bg-card p-7 shadow-sm transition hover:shadow-md"
              >
                <div className="grid size-12 shrink-0 place-items-center rounded-xl bg-primary/10">
                  <Icon className="size-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-heading text-lg font-bold text-foreground">{title}</h3>
                  <p className="mt-1.5 text-base leading-relaxed text-muted-foreground">{text}</p>
                </div>
              </div>
              )
            })}
          </div>

          {/* bottom CTA inside this section */}
          <div className="mt-14 flex flex-col items-center gap-3 text-center">
            <p className="text-base font-medium text-foreground">
              Ready to take the first step?
            </p>
            <Link href="/apply">
              <Button variant="outline" className="gap-2 px-8">
                Apply now <ArrowRight className="size-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
      )}

      <SiteFooter contact={content.contact} />
      <AccessibilityToolbar />
    </div>
  )
}
