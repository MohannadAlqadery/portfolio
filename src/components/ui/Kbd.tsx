import type { ComponentPropsWithoutRef } from 'react'
import { cn } from '@/lib/cn'

/** Keyboard key, e.g. <Kbd>Ctrl</Kbd> <Kbd>K</Kbd>. */
export function Kbd({ className, ...props }: ComponentPropsWithoutRef<'kbd'>) {
  return (
    <kbd
      className={cn(
        'inline-flex h-5 min-w-5 items-center justify-center rounded-sm border border-line-strong bg-raised px-1.5 font-mono text-[0.6875rem] leading-none text-fg-muted',
        className,
      )}
      {...props}
    />
  )
}
