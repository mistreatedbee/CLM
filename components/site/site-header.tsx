'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowRight, Menu, X } from 'lucide-react'
import { ClmLogo } from '@/components/clm-logo'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const links = [
  { href: '#mission', label: 'Mission' },
  { href: '#leadership', label: 'Leadership' },
  { href: '#benefits', label: 'Benefits' },
  { href: '#testimonials', label: 'Stories' },
  { href: '#contact', label: 'Contact' },
]

export function SiteHeader() {
  const [open, setOpen] = useState(false)

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-20 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" aria-label="CLM home">
          <ClmLogo />
        </Link>

        <nav className="hidden items-center gap-1 lg:flex" aria-label="Primary">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="rounded-lg px-4 py-2 text-base font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground"
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <Link href="/apply">
            <Button className="h-12 gap-2 px-6 text-base font-semibold">
              Apply now
              <ArrowRight className="size-5" />
            </Button>
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
          className="grid size-12 place-items-center rounded-xl border border-border text-foreground lg:hidden"
        >
          {open ? <X className="size-6" /> : <Menu className="size-6" />}
        </button>
      </div>

      <div
        className={cn(
          'overflow-hidden border-t border-border bg-background transition-all lg:hidden',
          open ? 'max-h-96' : 'max-h-0 border-t-0',
        )}
      >
        <nav className="flex flex-col gap-1 px-4 py-4" aria-label="Mobile">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="rounded-xl px-4 py-3 text-lg font-medium text-foreground hover:bg-muted"
            >
              {l.label}
            </a>
          ))}
          <div className="mt-2 flex flex-col gap-2">
            <Link href="/apply" onClick={() => setOpen(false)}>
              <Button className="h-14 w-full gap-2 text-lg font-semibold">
                Apply now <ArrowRight className="size-5" />
              </Button>
            </Link>
          </div>
        </nav>
      </div>
    </header>
  )
}
