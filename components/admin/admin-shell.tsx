'use client'

import { useState } from 'react'
import { Bell, Menu } from 'lucide-react'
import { AdminSidebar } from './admin-sidebar'

interface AdminShellProps {
  children: React.ReactNode
  userFullName: string
  userInitials: string
  userRole: string
}

export function AdminShell({ children, userFullName, userInitials, userRole }: AdminShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex min-h-dvh bg-muted/40">
      <AdminSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex items-center gap-4 border-b border-border bg-card/95 px-4 py-3 backdrop-blur sm:px-6">
          <button
            onClick={() => setSidebarOpen(true)}
            className="rounded-lg p-2 text-muted-foreground hover:bg-muted lg:hidden"
            aria-label="Open menu"
          >
            <Menu className="size-6" />
          </button>

          <div className="ml-auto flex items-center gap-3">
            <button
              className="relative rounded-xl p-2.5 text-muted-foreground hover:bg-muted"
              aria-label="Notifications"
            >
              <Bell className="size-5" />
              <span className="absolute right-2 top-2 size-2 rounded-full bg-gold" />
            </button>
            <div className="flex items-center gap-3 rounded-xl border border-border bg-background px-3 py-1.5">
              <div className="grid size-9 place-items-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                {userInitials}
              </div>
              <div className="hidden text-left sm:block">
                <p className="text-sm font-semibold leading-tight text-foreground">{userFullName}</p>
                <p className="text-xs text-muted-foreground capitalize">{userRole}</p>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  )
}
