import Link from 'next/link'
import { Globe, Lock, Mail, MapPin, Phone } from 'lucide-react'
import { ClmLogo } from '@/components/clm-logo'

export function SiteFooter() {
  return (
    <footer className="border-t border-sidebar-border bg-sidebar text-sidebar-foreground">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-4">
        <div className="md:col-span-1">
          <ClmLogo invert />
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-sidebar-foreground/70">
            Transforming Leaders, Transforming the Nations. Raising servant leaders to impact every
            community for Christ.
          </p>
        </div>

        <div>
          <h3 className="font-heading text-sm font-bold uppercase tracking-wide text-sidebar-foreground/60">
            Explore
          </h3>
          <ul className="mt-4 space-y-3 text-sm">
            <li>
              <a href="#mission" className="text-sidebar-foreground/80 hover:text-white">
                Our mission
              </a>
            </li>
            <li>
              <a href="#leadership" className="text-sidebar-foreground/80 hover:text-white">
                Leadership
              </a>
            </li>
            <li>
              <a href="#benefits" className="text-sidebar-foreground/80 hover:text-white">
                Benefits
              </a>
            </li>
            <li>
              <Link href="/apply" className="text-sidebar-foreground/80 hover:text-white">
                Apply now
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="font-heading text-sm font-bold uppercase tracking-wide text-sidebar-foreground/60">
            Contact us
          </h3>
          <ul className="mt-4 space-y-3 text-sm">
            <li>
              <a
                href="tel:+27732047642"
                className="flex items-center gap-3 text-sidebar-foreground/80 hover:text-white"
              >
                <Phone className="size-4 shrink-0 text-sidebar-primary" /> 073 204 7642
              </a>
            </li>
            <li>
              <a
                href="mailto:kenstraining04@gmail.com"
                className="flex items-center gap-3 text-sidebar-foreground/80 hover:text-white"
              >
                <Mail className="size-4 shrink-0 text-sidebar-primary" /> kenstraining04@gmail.com
              </a>
            </li>
            <li>
              <a
                href="https://www.christianleadershipmovement.co.za"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 text-sidebar-foreground/80 hover:text-white"
              >
                <Globe className="size-4 shrink-0 text-sidebar-primary" /> christianleadershipmovement.co.za
              </a>
            </li>
            <li className="flex items-start gap-3 text-sidebar-foreground/80">
              <MapPin className="mt-0.5 size-4 shrink-0 text-sidebar-primary" />
              House No. 1717, Dwarsloop Phase 2, South Africa
            </li>
          </ul>
        </div>

        <div>
          <h3 className="font-heading text-sm font-bold uppercase tracking-wide text-sidebar-foreground/60">
            Office hours
          </h3>
          <ul className="mt-4 space-y-3 text-sm text-sidebar-foreground/80">
            <li>Mon – Fri: 08:00 – 17:00</li>
            <li>Sat: 09:00 – 13:00</li>
            <li>Sun: Closed</li>
          </ul>
        </div>
      </div>

      <div className="border-t border-sidebar-border/60">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-6 text-xs text-sidebar-foreground/60 sm:flex-row sm:px-6">
          <p>
            &copy; {new Date().getFullYear()} Christian Leadership Movement. All rights reserved.
          </p>
          <Link
            href="/admin/login"
            className="inline-flex items-center gap-2 rounded-lg border border-sidebar-foreground/20 bg-sidebar-foreground/10 px-4 py-2 text-sm font-semibold text-sidebar-foreground/80 transition-colors hover:bg-sidebar-foreground/20 hover:text-white"
          >
            <Lock className="size-4" /> Admin Login
          </Link>
        </div>
      </div>
    </footer>
  )
}
