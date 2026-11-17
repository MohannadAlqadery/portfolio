import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

type SectionHeaderProps = {
  /** 1-based position of the section on the page. */
  index: number
  /** Total number of indexed sections. */
  total: number
  /** Short mono label shown next to the index, e.g. "Case files". */
  kicker: string
  /** Editorial headline. */
  title: ReactNode
  /** Id for the heading so the section can use `aria-labelledby`. */
  headingId?: string
  /** Optional supporting content aligned with the headline. */
  children?: ReactNode
  className?: string
}

const pad = (n: number) => n.toString().padStart(2, '0')

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
    <header
      className={cn('grid gap-4 border-t border-line pt-5 md:grid-cols-12 md:gap-8', className)}
    >
      <p className="label text-fg-subtle md:col-span-3">
        <span className="text-signal">{pad(index)}</span>
        <span aria-hidden="true"> / {pad(total)}</span>
        <span className="sr-only"> of {total}</span>
        <span aria-hidden="true"> · </span>
        {kicker}
      </p>
      <div className="md:col-span-9">
        <h2 id={headingId} className="font-display text-headline text-balance text-fg">
          {title}
        </h2>
        {children ? <div className="mt-4 max-w-2xl text-fg-muted">{children}</div> : null}
      </div>
    </header>
  )
}
