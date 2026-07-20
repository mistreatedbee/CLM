import { cn } from '@/lib/utils'

export function ClmLogo({
  className,
  showText = true,
  invert = false,
}: {
  className?: string
  showText?: boolean
  invert?: boolean
}) {
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary shadow-sm">
        <svg viewBox="0 0 24 24" className="size-6" aria-hidden="true">
          {/* Cross */}
          <rect x="10" y="3" width="4" height="18" rx="1.2" fill="var(--gold)" />
          <rect x="5" y="8" width="14" height="4" rx="1.2" fill="var(--gold)" />
        </svg>
      </span>
      {showText && (
        <span className="flex flex-col leading-none">
          <span
            className={cn(
              'font-heading text-lg font-extrabold tracking-tight',
              invert ? 'text-white' : 'text-foreground',
            )}
          >
            CLM
          </span>
          <span
            className={cn(
              'text-[11px] font-medium',
              invert ? 'text-white/70' : 'text-muted-foreground',
            )}
          >
            Leadership Movement
          </span>
        </span>
      )}
    </span>
  )
}
