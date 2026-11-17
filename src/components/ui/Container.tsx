import type { ComponentPropsWithoutRef } from 'react'
import { cn } from '@/lib/cn'

type ContainerElement = 'div' | 'section' | 'header' | 'footer' | 'main' | 'nav'

type ContainerProps = ComponentPropsWithoutRef<'div'> & {
  as?: ContainerElement
}

/** Page-width wrapper with responsive side gutters. */
export function Container({ as: Element = 'div', className, ...props }: ContainerProps) {
  return <Element className={cn('container-page', className)} {...props} />
}
