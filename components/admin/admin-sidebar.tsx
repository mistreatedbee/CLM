'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  BarChart3,
  FileText,
  LayoutDashboard,
  LogOut,
  MessageCircle,
  Settings,
  Users,
  X,
} from 'lucide-react'
import { ClmLogo } from '@/components/clm-logo'
import { cn } from '@/lib/utils'
import { signOut } from '@/app/actions/auth'

const NAV = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/applications', label: 'Applications', icon: FileText },
  { href: '/admin/members', label: 'Members', icon: Users },
  { href: '/admin/reports', label: 'Reports', icon: BarChart3 },
  { href: '/admin/whatsapp', label: 'WhatsApp', icon: MessageCircle },
]

export function AdminSidebar({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const pathname = usePathname()

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-30 bg-foreground/40 lg:hidden"
          onClick={onClose}
          aria-hidden
        />
      )}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-sidebar-border bg-sidebar transition-transform duration-300 lg:static lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex items-center justify-between border-b border-sidebar-border px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="overflow-hidden rounded-xl border border-white/10">
              <img
                src="/images/logo.jpeg"
                alt="CLM"
                className="h-10 w-10 object-cover"
              />
            </div>
            <div className="flex flex-col leading-none">
              <span className="font-heading text-base font-extrabold tracking-tight text-white">CLM</span>
              <span className="text-[11px] font-medium text-white/60">Admin Portal</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-sidebar-foreground/70 hover:bg-sidebar-accent lg:hidden"
            aria-label="Close menu"
          >
            <X className="size-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-5">
          {NAV.map((item) => {
            const active =
              item.href === '/admin'
                ? pathname === '/admin'
                : pathname.startsWith(item.href)
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  'flex items-center gap-3 rounded-xl px-4 py-3 text-base font-medium transition',
                  active
                    ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                    : 'text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground',
                )}
              >
                <Icon className="size-5 shrink-0" />
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="border-t border-sidebar-border px-3 py-4">
          <Link
            href="/admin/settings"
            onClick={onClose}
            className="flex items-center gap-3 rounded-xl px-4 py-3 text-base font-medium text-sidebar-foreground/80 transition hover:bg-sidebar-accent hover:text-sidebar-foreground"
          >
            <Settings className="size-5" /> Settings
          </Link>
          <form action={signOut}>
            <button
              type="submit"
              className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-base font-medium text-sidebar-foreground/80 transition hover:bg-sidebar-accent hover:text-sidebar-foreground"
            >
              <LogOut className="size-5" /> Sign out
            </button>
          </form>
        </div>
      </aside>
    </>
  )
}
