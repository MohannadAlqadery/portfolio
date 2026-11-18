import type { ComponentPropsWithoutRef, MouseEvent } from 'react'
import { isPlainClick, navigate } from '@/lib/router'

type LinkProps = ComponentPropsWithoutRef<'a'> & { to: string }

/** Internal link: a real `<a href>` (crawlable, works without JS) with client-side navigation. */
export function Link({ to, onClick, children, ...props }: LinkProps) {
  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(event)
    if (!isPlainClick(event)) return
    event.preventDefault()
    navigate(to)
  }

  return (
    <a href={to} onClick={handleClick} {...props}>
      {children}
    </a>
  )
}
