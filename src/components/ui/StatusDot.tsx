import { cn } from '@/lib/cn'

type StatusTone = 'signal' | 'medium' | 'critical' | 'subtle'

const toneClasses: Record<StatusTone, string> = {
  signal: 'text-signal',
  medium: 'text-sev-medium',
  critical: 'text-sev-critical',
  subtle: 'text-fg-subtle',
}

type StatusDotProps = {
  tone?: StatusTone
  /** Animated ring; automatically disabled for users who prefer reduced motion. */
  pulse?: boolean
  /** Accessible text. When omitted the dot is treated as decorative. */
  label?: string
  className?: string
}

export function StatusDot({ tone = 'signal', pulse = false, label, className }: StatusDotProps) {
  return (
    <span className={cn('inline-flex items-center', toneClasses[tone], className)}>
      <span
        aria-hidden="true"
        className={cn('size-2 rounded-full bg-current', pulse && 'animate-pulse-dot')}
      />
      {label ? <span className="sr-only">{label}</span> : null}
    </span>
  )
}
