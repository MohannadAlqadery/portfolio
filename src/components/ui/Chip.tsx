import type { ComponentPropsWithoutRef } from 'react'
import { cn } from '@/lib/cn'

export type Severity = 'critical' | 'high' | 'medium' | 'low' | 'info'
export type ChipVariant = 'neutral' | 'signal' | Severity

const variantClasses: Record<ChipVariant, string> = {
  neutral: 'border-line-strong text-fg-muted',
  signal: 'border-signal/35 bg-signal-wash text-signal',
  critical: 'border-sev-critical/35 bg-sev-critical/10 text-sev-critical',
  high: 'border-sev-high/35 bg-sev-high/10 text-sev-high',
  medium: 'border-sev-medium/35 bg-sev-medium/10 text-sev-medium',
  low: 'border-sev-low/35 bg-sev-low/10 text-sev-low',
  info: 'border-line-strong bg-raised text-sev-info',
}

type ChipProps = ComponentPropsWithoutRef<'span'> & {
  variant?: ChipVariant
  /** Show a small leading dot in the chip colour. */
  dot?: boolean
}

/** Compact mono tag for statuses, severities and metadata. */
export function Chip({
  variant = 'neutral',
  dot = false,
  className,
  children,
  ...props
}: ChipProps) {
  return (
    <span
      className={cn(
        'inline-flex h-6 items-center gap-1.5 rounded-sm border px-2 label whitespace-nowrap',
        variantClasses[variant],
        className,
      )}
      {...props}
    >
      {dot ? (
        <span
          aria-hidden="true"
          // Green "signal" dots blink like a live LED; severity dots stay steady.
          className={cn(
            'size-1.5 rounded-full bg-current',
            variant === 'signal' && 'animate-blink',
          )}
        />
      ) : null}
      {children}
    </span>
  )
}
