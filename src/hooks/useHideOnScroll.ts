import { useCallback, useEffect, useState } from 'react'

type Options = {
  /** Ignore jitter smaller than this many pixels. */
  threshold?: number
  /** Never hide while this close to the top of the page. */
  minY?: number
}

/**
 * "Hide on scroll down, show on scroll up" for a header. Returns whether it should be hidden, and
 * `reveal()` to show it immediately (e.g. when keyboard focus moves into it).
 * Disabled (always visible) while `enabled` is false, e.g. when a menu is open.
 */
export function useHideOnScroll(
  enabled: boolean,
  { threshold = 8, minY = 80 }: Options = {},
): [hidden: boolean, reveal: () => void] {
  const [hidden, setHidden] = useState(false)
  const reveal = useCallback(() => setHidden(false), [])

  useEffect(() => {
    if (!enabled) return

    let lastY = window.scrollY
    let frame = 0

    const onScroll = () => {
      if (frame) return
      frame = requestAnimationFrame(() => {
        frame = 0
        const y = window.scrollY
        if (y <= minY) {
          setHidden(false)
          lastY = y
          return
        }
        const delta = y - lastY
        if (Math.abs(delta) < threshold) return
        setHidden(delta > 0)
        lastY = y
      })
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      cancelAnimationFrame(frame)
    }
  }, [enabled, threshold, minY])

  return [enabled && hidden, reveal]
}
