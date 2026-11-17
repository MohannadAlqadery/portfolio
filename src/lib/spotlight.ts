import type { PointerEvent } from 'react'

/** Pointer-move handler for elements using the `spotlight` utility. */
export function trackSpotlight(event: PointerEvent<HTMLElement>): void {
  if (event.pointerType !== 'mouse') return
  const target = event.currentTarget
  const rect = target.getBoundingClientRect()
  target.style.setProperty('--spot-x', `${event.clientX - rect.left}px`)
  target.style.setProperty('--spot-y', `${event.clientY - rect.top}px`)
}
