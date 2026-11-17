import { cn } from '@/lib/cn'

type RuleProps = {
  /** Optional mono annotation placed on the line. */
  label?: string
  className?: string
}

/** Hairline divider, optionally annotated: ── LABEL ──────────── */
export function Rule({ label, className }: RuleProps) {
  if (!label) {
    return <hr className={cn('border-0 border-t border-line', className)} />
  }

  return (
    <div className={cn('flex items-center gap-3', className)}>
      <hr aria-label={label} className="sr-only" />
      <span aria-hidden="true" className="h-px w-6 bg-line" />
      <span aria-hidden="true" className="label text-fg-subtle">
        {label}
      </span>
      <span aria-hidden="true" className="h-px flex-1 bg-line" />
    </div>
  )
}
