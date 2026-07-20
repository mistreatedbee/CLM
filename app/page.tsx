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

const WHY_JOIN = [
  {
    icon: GraduationCap,
    title: 'World-class training',
    text: 'Structured courses on servant leadership, discipleship, and pastoral care developed over decades of ministry.',
  },
  {
    icon: Users,
    title: 'A caring community',
    text: 'Join a family of believers across South Africa who support, pray for, and walk alongside one another.',
  },
  {
    icon: HandHeart,
    title: 'Real impact',
    text: 'Lead outreach programmes that bring lasting change into homes, churches, and communities around you.',
  },
  {
    icon: BookOpen,
    title: 'Grow spiritually',
    text: 'Deepen your walk with God through mentorship, accountability, and purposeful discipleship.',
  },
]

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* ── Hero ── */}
      <main className="relative flex flex-col items-center overflow-hidden bg-background px-4 pb-24 pt-20 text-center">
        {/* subtle radial glow behind hero */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[520px] bg-[radial-gradient(ellipse_80%_60%_at_50%_0%,rgba(12,26,99,0.12),transparent)]"
        />

        {/* badge */}
        <span className="mb-8 inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-sm font-medium text-muted-foreground shadow-sm">
          <Sparkles className="size-4 text-[color:var(--gold)]" />
          Applications are open for 2026
        </span>

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
          Christian Leadership{' '}
          <span className="text-primary">Movement</span>
        </h1>

        <p className="mt-4 text-lg font-semibold text-[color:var(--gold)] sm:text-xl">
          Transforming Leaders, Transforming the Nations
        </p>

        <p className="mx-auto mt-5 max-w-lg text-base leading-relaxed text-muted-foreground">
          Join a movement of Christ-centred leaders equipped to serve, disciple,
          and bring lasting change to every community in South Africa and beyond.
        </p>

        <Link href="/apply" className="mt-10">
          <Button size="lg" className="h-16 gap-3 px-12 text-xl font-bold shadow-lg shadow-primary/25">
            Start your application <ArrowRight className="size-6" />
          </Button>
        </Link>

        <p className="mt-5 text-sm text-muted-foreground">
          Free to apply · Takes about 15 minutes · Saves automatically
        </p>
      </main>

      {/* ── Why Join ── */}
      <section className="bg-secondary/50 px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-5xl">
          <div className="mb-14 text-center">
            <h2 className="font-heading text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
              Why join the movement?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-muted-foreground">
              Whether you are just starting out or have served for years, CLM meets
              you where you are and helps you go further.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            {WHY_JOIN.map(({ icon: Icon, title, text }) => (
              <div
                key={title}
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
            ))}
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

      <SiteFooter />
      <AccessibilityToolbar />
    </div>
  )
}
