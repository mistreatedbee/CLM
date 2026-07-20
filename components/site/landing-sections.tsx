import Link from 'next/link'
import {
  ArrowRight,
  BookOpen,
  Clock,
  Compass,
  GraduationCap,
  HandHeart,
  HeartHandshake,
  Quote,
  ShieldCheck,
  Sparkles,
  Star,
  Target,
  Users,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-background">
      <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 sm:px-6 md:py-24 lg:grid-cols-2">
        <div className="text-center lg:text-left">
          <Badge variant="gold" className="mb-6 px-4 py-1.5 text-sm">
            <Sparkles className="size-4" /> Applications are open for 2026
          </Badge>
          <h1 className="font-heading text-4xl font-extrabold leading-[1.1] tracking-tight text-balance text-foreground sm:text-5xl md:text-6xl">
            Become the leader God <span className="text-[color:var(--gold)]">called you</span> to be
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground lg:mx-0">
            The Christian Leadership Movement equips everyday believers to serve, lead, and
            transform their communities. Applying is simple and takes about 15 minutes.
          </p>
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row lg:items-start lg:justify-start">
            <Link href="/apply" className="w-full sm:w-auto">
              <Button className="h-14 w-full gap-2 px-8 text-lg font-semibold sm:w-auto">
                Start your application <ArrowRight className="size-5" />
              </Button>
            </Link>
            <a href="#mission" className="w-full sm:w-auto">
              <Button variant="outline" className="h-14 w-full px-8 text-lg sm:w-auto">
                Learn more
              </Button>
            </a>
          </div>
          <div className="mt-8 flex items-center justify-center gap-6 text-sm text-muted-foreground lg:justify-start">
            <span className="flex items-center gap-2">
              <ShieldCheck className="size-5 text-success" /> Free to apply
            </span>
            <span className="flex items-center gap-2">
              <Clock className="size-5 text-primary" /> ~15 minutes
            </span>
          </div>
        </div>

        <div className="relative">
          <div className="absolute -inset-4 -z-10 rounded-[2.5rem] bg-gold/10 blur-2xl" />
          <img
            src="/images/hero-illustration.png"
            alt="A diverse group of Christian community leaders standing together in welcome"
            className="mx-auto w-full max-w-lg rounded-[2rem] border border-border bg-card shadow-xl"
          />
        </div>
      </div>
    </section>
  )
}

export function MissionVision() {
  return (
    <section id="mission" className="bg-secondary/50 py-16 md:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-heading text-3xl font-extrabold tracking-tight text-balance text-foreground sm:text-4xl">
            Rooted in faith. Focused on people.
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
            We exist to raise servant leaders who carry hope into every home, church, and community.
          </p>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-2">
          <Card className="border-none bg-primary text-primary-foreground shadow-lg">
            <CardContent className="p-8">
              <div className="mb-5 grid size-14 place-items-center rounded-2xl bg-white/10">
                <Target className="size-7 text-[color:var(--gold)]" />
              </div>
              <h3 className="font-heading text-2xl font-bold">Our Mission</h3>
              <p className="mt-3 text-lg leading-relaxed text-primary-foreground/80">
                To identify, train, and release Christ-centred leaders who serve their communities
                with humility, integrity, and love.
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-lg">
            <CardContent className="p-8">
              <div className="mb-5 grid size-14 place-items-center rounded-2xl bg-gold/15">
                <Compass className="size-7 text-[color:var(--gold)]" />
              </div>
              <h3 className="font-heading text-2xl font-bold text-foreground">Our Vision</h3>
              <p className="mt-3 text-lg leading-relaxed text-muted-foreground">
                A generation of empowered believers transforming every sphere of society through
                bold, compassionate leadership.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  )
}

const leaders = [
  {
    name: 'Rev. Daniel Khumalo',
    role: 'National Director',
    img: '/images/leader-1.png',
  },
  {
    name: 'Sister Mary Botha',
    role: 'Head of Training',
    img: '/images/leader-2.png',
  },
  {
    name: 'Apostle John Mahlangu',
    role: 'Spiritual Advisor',
    img: '/images/leader-3.png',
  },
]

export function Leadership() {
  return (
    <section id="leadership" className="py-16 md:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-heading text-3xl font-extrabold tracking-tight text-balance text-foreground sm:text-4xl">
            Meet the people who will walk with you
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
            Experienced, caring leaders committed to helping you grow.
          </p>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {leaders.map((l) => (
            <Card key={l.name} className="overflow-hidden text-center transition hover:shadow-lg">
              <img
                src={l.img || '/placeholder.svg'}
                alt={`Portrait of ${l.name}`}
                className="aspect-[4/3] w-full object-cover"
              />
              <CardContent className="p-6">
                <h3 className="font-heading text-xl font-bold text-foreground">{l.name}</h3>
                <p className="mt-1 text-base text-[color:var(--gold)]">{l.role}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}

const reasons = [
  {
    icon: GraduationCap,
    title: 'World-class training',
    text: 'Structured courses on servant leadership, discipleship, and pastoral care.',
  },
  {
    icon: Users,
    title: 'A caring community',
    text: 'Join a family of believers who support and pray for one another.',
  },
  {
    icon: HandHeart,
    title: 'Real impact',
    text: 'Lead outreach programmes that change lives in your own community.',
  },
  {
    icon: BookOpen,
    title: 'Grow spiritually',
    text: 'Deepen your walk with God through mentorship and accountability.',
  },
]

export function WhyJoin() {
  return (
    <section className="bg-secondary/50 py-16 md:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div>
            <h2 className="font-heading text-3xl font-extrabold tracking-tight text-balance text-foreground sm:text-4xl">
              Why join the movement?
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
              Whether you are just starting out or have served for years, CLM meets you where you
              are and helps you go further.
            </p>
            <div className="mt-8 grid gap-5 sm:grid-cols-2">
              {reasons.map((r) => (
                <div key={r.title} className="flex gap-4">
                  <div className="grid size-12 shrink-0 place-items-center rounded-xl bg-primary/10">
                    <r.icon className="size-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-heading text-lg font-bold text-foreground">{r.title}</h3>
                    <p className="mt-1 text-base leading-relaxed text-muted-foreground">{r.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="relative">
            <div className="absolute -inset-4 -z-10 rounded-[2.5rem] bg-primary/10 blur-2xl" />
            <img
              src="/images/community.png"
              alt="Church community worshipping together with joy"
              className="w-full rounded-[2rem] border border-border object-cover shadow-xl"
            />
          </div>
        </div>
      </div>
    </section>
  )
}

const benefits = [
  'Official CLM membership and ID',
  'Recognised leadership certificates',
  'Access to conferences and retreats',
  'Personal mentorship from senior leaders',
  'Ongoing training and resources',
  'A lifelong network of fellow leaders',
]

export function Benefits() {
  return (
    <section id="benefits" className="py-16 md:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-heading text-3xl font-extrabold tracking-tight text-balance text-foreground sm:text-4xl">
            What you receive as a member
          </h2>
        </div>
        <div className="mx-auto mt-12 grid max-w-4xl gap-4 sm:grid-cols-2">
          {benefits.map((b) => (
            <div
              key={b}
              className="flex items-center gap-4 rounded-2xl border border-border bg-card p-5"
            >
              <div className="grid size-10 shrink-0 place-items-center rounded-full bg-success/12">
                <HeartHandshake className="size-5 text-success" />
              </div>
              <span className="text-lg font-medium text-foreground">{b}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

const testimonials = [
  {
    name: 'Miriam Adeyemi',
    role: 'Deacon, Grace Family Church',
    text: 'CLM gave me the confidence and the tools to lead. The training changed how I serve my community.',
  },
  {
    name: 'Emmanuel Okafor',
    role: 'Elder, Cornerstone Chapel',
    text: 'The mentorship is priceless. I have grown more in one year than in the previous ten.',
  },
  {
    name: 'Rebecca Ntuli',
    role: 'Leader, New Life Centre',
    text: 'Applying was so easy, even for someone like me who is not good with phones. Everything was clear.',
  },
]

export function Testimonials() {
  return (
    <section id="testimonials" className="bg-primary py-16 text-primary-foreground md:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-heading text-3xl font-extrabold tracking-tight text-balance sm:text-4xl">
            Stories from our members
          </h2>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {testimonials.map((t) => (
            <div
              key={t.name}
              className="flex flex-col rounded-2xl bg-white/5 p-7 ring-1 ring-white/10"
            >
              <Quote className="size-8 text-[color:var(--gold)]" />
              <p className="mt-4 flex-1 text-lg leading-relaxed text-primary-foreground/90">
                {t.text}
              </p>
              <div className="mt-6 flex items-center gap-3">
                <div className="grid size-12 place-items-center rounded-full bg-[color:var(--gold)] font-heading text-lg font-bold text-[color:var(--gold-foreground)]">
                  {t.name.charAt(0)}
                </div>
                <div>
                  <p className="font-heading font-bold">{t.name}</p>
                  <p className="text-sm text-primary-foreground/70">{t.role}</p>
                </div>
              </div>
              <div className="mt-4 flex gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="size-4 fill-[color:var(--gold)] text-[color:var(--gold)]" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export function CallToAction() {
  return (
    <section className="py-16 md:py-24">
      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        <div className="relative overflow-hidden rounded-[2rem] border border-border bg-card p-10 text-center shadow-xl md:p-16">
          <div className="absolute -right-16 -top-16 -z-0 size-48 rounded-full bg-gold/10 blur-2xl" />
          <div className="relative">
            <h2 className="font-heading text-3xl font-extrabold tracking-tight text-balance text-foreground sm:text-4xl">
              Ready to take the first step?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-lg leading-relaxed text-muted-foreground">
              Your application takes about 15 minutes. You can save your progress and finish later.
            </p>
            <Link href="/apply" className="mt-8 inline-block">
              <Button className="h-14 gap-2 px-10 text-lg font-semibold">
                Start your application <ArrowRight className="size-5" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}

export function ContactSection() {
  return (
    <section id="contact" className="bg-secondary/50 py-16 md:py-24">
      <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
        <h2 className="font-heading text-3xl font-extrabold tracking-tight text-balance text-foreground sm:text-4xl">
          Have questions? We are here to help.
        </h2>
        <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
          Our team is happy to guide you through anything you need. Reach out any time.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <a href="tel:+27123456789" className="w-full sm:w-auto">
            <Button variant="outline" className="h-14 w-full gap-2 px-8 text-lg sm:w-auto">
              Call +27 12 345 6789
            </Button>
          </a>
          <a href="mailto:hello@clm.org.za" className="w-full sm:w-auto">
            <Button className="h-14 w-full gap-2 px-8 text-lg sm:w-auto">Email us</Button>
          </a>
        </div>
      </div>
    </section>
  )
}
