'use client'

import { useEffect, useRef, useState } from 'react'
import {
  Accessibility,
  AArrowDown,
  AArrowUp,
  Contrast,
  Moon,
  RotateCcw,
  Sun,
  X,
} from 'lucide-react'
import { useAccessibility } from './accessibility-provider'
import { cn } from '@/lib/utils'

export function AccessibilityToolbar() {
  const {
    resolvedTheme,
    toggleTheme,
    highContrast,
    setHighContrast,
    increaseFont,
    decreaseFont,
    resetFont,
    fontScale,
  } = useAccessibility()
  const [open, setOpen] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  return (
    <div className="fixed bottom-5 right-5 z-50 print:hidden">
      {open && (
        <div
          ref={panelRef}
          role="dialog"
          aria-label="Accessibility options"
          className="mb-3 w-72 rounded-2xl border border-border bg-card p-5 shadow-2xl shadow-primary/10"
        >
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-heading text-lg font-bold text-card-foreground">Accessibility</h2>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close accessibility options"
              className="grid size-9 place-items-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <X className="size-5" />
            </button>
          </div>

          {/* Font size */}
          <div className="mb-5">
            <p className="mb-2 text-sm font-semibold text-muted-foreground">Text size</p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={decreaseFont}
                disabled={fontScale <= 1}
                aria-label="Decrease text size"
                className="flex h-12 flex-1 items-center justify-center gap-1 rounded-xl border border-border bg-background text-foreground transition hover:bg-muted disabled:opacity-40"
              >
                <AArrowDown className="size-5" />
              </button>
              <span
                className="min-w-14 text-center text-sm font-bold tabular-nums text-foreground"
                aria-live="polite"
              >
                {Math.round(fontScale * 100)}%
              </span>
              <button
                type="button"
                onClick={increaseFont}
                disabled={fontScale >= 1.5}
                aria-label="Increase text size"
                className="flex h-12 flex-1 items-center justify-center gap-1 rounded-xl border border-border bg-background text-foreground transition hover:bg-muted disabled:opacity-40"
              >
                <AArrowUp className="size-5" />
              </button>
            </div>
            {fontScale !== 1 && (
              <button
                type="button"
                onClick={resetFont}
                className="mt-2 flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
              >
                <RotateCcw className="size-3.5" /> Reset text size
              </button>
            )}
          </div>

          {/* Theme */}
          <ToggleRow
            label="Dark mode"
            icon={resolvedTheme === 'dark' ? <Moon className="size-5" /> : <Sun className="size-5" />}
            active={resolvedTheme === 'dark'}
            onClick={toggleTheme}
          />

          {/* High contrast */}
          <ToggleRow
            label="High contrast"
            icon={<Contrast className="size-5" />}
            active={highContrast}
            onClick={() => setHighContrast(!highContrast)}
          />
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-label="Accessibility options"
        className="flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-xl shadow-primary/30 transition hover:scale-105 active:scale-95"
      >
        <Accessibility className="size-7" />
      </button>
    </div>
  )
}

function ToggleRow({
  label,
  icon,
  active,
  onClick,
}: {
  label: string
  icon: React.ReactNode
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      role="switch"
      aria-checked={active}
      className="mb-2 flex w-full items-center justify-between rounded-xl border border-border bg-background px-4 py-3 text-left transition hover:bg-muted"
    >
      <span className="flex items-center gap-3 font-medium text-foreground">
        <span className="text-muted-foreground">{icon}</span>
        {label}
      </span>
      <span
        className={cn(
          'relative h-6 w-11 shrink-0 rounded-full transition-colors',
          active ? 'bg-primary' : 'bg-muted-foreground/30',
        )}
      >
        <span
          className={cn(
            'absolute top-0.5 size-5 rounded-full bg-white shadow transition-transform',
            active ? 'translate-x-[22px]' : 'translate-x-0.5',
          )}
        />
      </span>
    </button>
  )
}
