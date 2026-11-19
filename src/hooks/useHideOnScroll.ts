import { useCallback, useEffect, useState } from 'react'

type Options = {
  /** Distance to scroll down, in one go, before hiding. Stops small nudges from hiding it. */
  hideAfter?: number
  /** Distance to scroll up, in one go, before showing again. */
  showAfter?: number
  /** Never hide while this close to the top of the page. */
  minY?: number
}

/**
 * "Hide on scroll down, show on scroll up" for a header. Returns whether it should be hidden, and
 * `reveal()` to show it immediately (e.g. when keyboard focus moves into it).
 * Disabled (always visible) while `enabled` is false, e.g. when a menu is open.
 *
 * Distances are accumulated per direction, so momentum scrolling and iOS rubber-banding at the
 * top or bottom of the page don't make the header flicker in and out.
 */
export function useHideOnScroll(
  enabled: boolean,
  { hideAfter = 48, showAfter = 24, minY = 96 }: Options = {},
): [hidden: boolean, reveal: () => void] {
  const [hidden, setHidden] = useState(false)
  const reveal = useCallback(() => setHidden(false), [])

  useEffect(() => {
    if (!enabled) return

    const maxY = () => document.documentElement.scrollHeight - window.innerHeight
    // Rubber-banding reports positions past either end; treat those as the end itself.
    const currentY = () => Math.min(Math.max(window.scrollY, 0), Math.max(maxY(), 0))

    let lastY = currentY()
    let travelled = 0
    let frame = 0

    const update = () => {
      frame = 0
      const y = currentY()
      const delta = y - lastY
      lastY = y

      if (y <= minY) {
        travelled = 0
        setHidden(false)
        return
      }
      if (delta === 0) return
      // Reset the running total whenever the direction changes.
      travelled = Math.sign(delta) === Math.sign(travelled) ? travelled + delta : delta
      if (travelled > hideAfter) setHidden(true)
      else if (travelled < -showAfter) setHidden(false)
    }

    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update)
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      cancelAnimationFrame(frame)
    }
  }, [enabled, hideAfter, showAfter, minY])

  return [enabled && hidden, reveal]
}
