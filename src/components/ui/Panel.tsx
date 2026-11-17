import type { ComponentPropsWithoutRef, ReactNode } from 'react'
import { cn } from '@/lib/cn'

type PanelProps = Omit<ComponentPropsWithoutRef<'div'>, 'title'> & {
  /** Mono label in the header bar (left). */
  title?: ReactNode
  /** Mono metadata in the header bar (right). */
  meta?: ReactNode
  /** Remove inner padding, e.g. for code or tables. */
  flush?: boolean
}

/** Bordered surface with an optional console-style header bar. */
export function Panel({ title, meta, flush = false, className, children, ...props }: PanelProps) {
  const hasHeader = title !== undefined || meta !== undefined

  return (
    <div
      className={cn('overflow-hidden rounded-md border border-line bg-surface', className)}
      {...props}
    >
      {hasHeader ? (
        <div className="flex min-h-9 items-center justify-between gap-4 border-b border-line px-4 label text-fg-subtle">
          <span className="truncate">{title}</span>
          {meta !== undefined ? <span className="shrink-0">{meta}</span> : null}
        </div>
      ) : null}
      <div className={cn(!flush && 'p-4 sm:p-5')}>{children}</div>
    </div>
  )
}
