import type { ComponentPropsWithoutRef, MouseEvent } from 'react'
import { preloadRoute } from '@/lib/route-modules'
import { isPlainClick, navigate } from '@/lib/router'

type LinkProps = ComponentPropsWithoutRef<'a'> & { to: string }

/**
 * Internal link: a real `<a href>` (crawlable, works without JS) with client-side navigation.
 * Hovering or focusing it starts loading the target page, so the switch is instant.
 */
export function Link({ to, onClick, onPointerEnter, onFocus, children, ...props }: LinkProps) {
  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(event)
    if (!isPlainClick(event)) return
    event.preventDefault()
    navigate(to)
  }

  return (
    <a
      href={to}
      onClick={handleClick}
      onPointerEnter={(event) => {
        onPointerEnter?.(event)
        void preloadRoute(to)
      }}
      onFocus={(event) => {
        onFocus?.(event)
        void preloadRoute(to)
      }}
      {...props}
    >
      {children}
    </a>
  )
}
