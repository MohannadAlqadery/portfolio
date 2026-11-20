import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

type SectionHeaderProps = {
  /** 1-based position of the section on the page. */
  index: number
  /** Total number of indexed sections. */
  total: number
  /** Short mono label shown next to the index, e.g. "Case files". */
  kicker: string
  /** Big display title. Wrap a word in <em> to set it in the muted second tone. */
  title: ReactNode
  /** Id for the heading so the section can use `aria-labelledby`. */
  headingId?: string
  /** Short caption set against the title on the right (wraps below it on phones). */
  children?: ReactNode
  className?: string
}

const pad = (n: number) => n.toString().padStart(2, '0')

/**
 * v2 section header: index label, a large two-tone display title on the left and a short
 * caption on the right, like a magazine spread.
 */
export function SectionHeader({
  index,
  total,
  kicker,
  title,
  headingId,
  children,
  className,
}: SectionHeaderProps) {
  return (
    <div
      className={cn(
        'grid reveal gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,18rem)] md:items-end md:gap-12',
        className,
      )}
    >
      <div>
        <p className="label text-fg-subtle">
          <span className="text-signal">{pad(index)}</span>
          <span aria-hidden="true"> / {pad(total)}</span>
          <span className="sr-only"> of {total}</span>
          <span aria-hidden="true"> · </span>
          {kicker}
        </p>
        <h2
          id={headingId}
          className="mt-4 font-display text-[clamp(2.75rem,7vw,5.5rem)] leading-[0.92] font-bold tracking-[-0.035em] text-balance text-fg [&_em]:text-fg-subtle [&_em]:not-italic"
        >
          {title}
        </h2>
      </div>
      {children ? (
        <div className="text-sm leading-relaxed text-pretty text-fg-muted md:pb-2">{children}</div>
      ) : null}
    </div>
  )
}
