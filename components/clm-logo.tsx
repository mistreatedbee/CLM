import Image from 'next/image'
import { cn } from '@/lib/utils'

export function ClmLogo({
  className,
  showText = true,
  invert = false,
  size = 'md',
}: {
  className?: string
  showText?: boolean
  invert?: boolean
  size?: 'sm' | 'md' | 'lg'
}) {
  const imgSize = size === 'sm' ? 32 : size === 'lg' ? 56 : 44

  return (
    <span className={cn('inline-flex items-center gap-3', className)}>
      <span
        className={cn(
          'shrink-0 overflow-hidden rounded-xl',
          size === 'sm' && 'rounded-lg',
          size === 'lg' && 'rounded-2xl',
        )}
        style={{ width: imgSize, height: imgSize }}
      >
        <Image
          src="/images/logo.jpeg"
          alt="Christian Leadership Movement logo"
          width={imgSize}
          height={imgSize}
          className="h-full w-full object-cover"
          priority
        />
      </span>
      {showText && (
        <span className="flex flex-col leading-none">
          <span
            className={cn(
              'font-heading font-extrabold tracking-tight',
              size === 'sm' ? 'text-base' : size === 'lg' ? 'text-2xl' : 'text-lg',
              invert ? 'text-white' : 'text-foreground',
            )}
          >
            CLM
          </span>
          <span
            className={cn(
              'font-medium',
              size === 'sm' ? 'text-[10px]' : 'text-[11px]',
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
