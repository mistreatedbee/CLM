import Link from 'next/link'
import { Mail, MapPin, Phone } from 'lucide-react'
import { ClmLogo } from '@/components/clm-logo'

export function SiteFooter() {
  return (
    <footer className="border-t border-sidebar-border bg-sidebar text-sidebar-foreground">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-4">
        <div className="md:col-span-1">
          <ClmLogo invert />
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-sidebar-foreground/70">
            Raising and equipping servant leaders to transform their communities for Christ.
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
                Apply
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="font-heading text-sm font-bold uppercase tracking-wide text-sidebar-foreground/60">
            Contact
          </h3>
          <ul className="mt-4 space-y-3 text-sm">
            <li className="flex items-center gap-3 text-sidebar-foreground/80">
              <Phone className="size-4 shrink-0 text-sidebar-primary" /> +27 12 345 6789
            </li>
            <li className="flex items-center gap-3 text-sidebar-foreground/80">
              <Mail className="size-4 shrink-0 text-sidebar-primary" /> hello@clm.org.za
            </li>
            <li className="flex items-start gap-3 text-sidebar-foreground/80">
              <MapPin className="mt-0.5 size-4 shrink-0 text-sidebar-primary" /> 100 Grace Avenue,
              Pretoria, South Africa
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
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-4 py-6 text-xs text-sidebar-foreground/60 sm:flex-row sm:px-6">
          <p>&copy; {new Date().getFullYear()} Christian Leadership Movement. All rights reserved.</p>
          <p>Built with care for everyone.</p>
        </div>
      </div>
    </footer>
  )
}
