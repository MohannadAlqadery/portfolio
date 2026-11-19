import { useCallback, useEffect, useRef, type RefObject } from 'react'

type Options = {
  /** Only active while this media query matches (e.g. phones and tablets). */
  media?: string
  /** Snap animation once scrolling stops. */
  snapMs?: number
}

const EASE_OUT = 'cubic-bezier(0.22, 1, 0.36, 1)'

/**
 * "Quick return" header, the way browser toolbars behave: while the page scrolls, the header moves
 * with it pixel for pixel (so it never fights a fast flick or lags a slow one), and once scrolling
 * stops a half-shown header settles fully in or out. It is driven straight from the scroll
 * position in requestAnimationFrame, writing only `translate` on the element, so React doesn't
 * re-render on scroll. Returns `reveal()` to bring it back at once (e.g. on keyboard focus).
 */
export function useQuickReturn(
  ref: RefObject<HTMLElement | null>,
  enabled: boolean,
  { media = '(max-width: 79.99rem)', snapMs = 320 }: Options = {},
): () => void {
  const offset = useRef(0)

  const apply = useCallback(
    (next: number, animate: boolean) => {
      const el = ref.current
      if (!el) return
      offset.current = next
      const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
      // While following the scroll there's no transition (it moves with the content); a settle
      // animates; at rest the inline styles are cleared so the stylesheet's own transitions apply.
      el.style.transition =
        animate && !reduce ? `translate ${snapMs}ms ${EASE_OUT}` : next ? 'none' : ''
      el.style.translate = next ? `0 ${-next}px` : ''
    },
    [ref, snapMs],
  )

  const reveal = useCallback(() => apply(0, true), [apply])

  useEffect(() => {
    const el = ref.current
    // No matchMedia (e.g. some test environments): leave the header in place.
    if (typeof window.matchMedia !== 'function') return
    const query = window.matchMedia(media)
    if (!el || !enabled || !query.matches) {
      if (offset.current) apply(0, true)
      // Re-evaluate when crossing the breakpoint.
      const onChange = () => apply(0, false)
      query.addEventListener('change', onChange)
      return () => query.removeEventListener('change', onChange)
    }

    const currentY = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight
      // Rubber-banding reports positions past either end; treat those as the end itself.
      return Math.min(Math.max(window.scrollY, 0), Math.max(max, 0))
    }

    let lastY = currentY()
    let frame = 0
    let settleTimer = 0

    const settle = () => {
      if (offset.current === 0) return
      const height = el.offsetHeight
      const y = currentY()
      if (y <= height) return apply(0, true)
      if (offset.current > 0 && offset.current < height) {
        apply(offset.current > height / 2 ? height : 0, true)
      }
    }

    const update = () => {
      frame = 0
      const y = currentY()
      const delta = y - lastY
      lastY = y
      if (delta === 0) return
      const height = el.offsetHeight
      // Near the top it's always fully shown; otherwise follow the scroll, clamped to its height.
      const next = y <= 0 ? 0 : Math.min(Math.max(offset.current + delta, 0), height)
      if (next !== offset.current) apply(next, false)
    }

    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update)
      // `scrollend` isn't everywhere yet (older iOS); a short idle timer covers it.
      window.clearTimeout(settleTimer)
      settleTimer = window.setTimeout(settle, 140)
    }
    const onScrollEnd = () => {
      window.clearTimeout(settleTimer)
      // `scrollend` can arrive before the queued frame: apply the last movement first.
      if (frame) {
        cancelAnimationFrame(frame)
        update()
      }
      settle()
    }
    const onBreakpoint = () => {
      if (!query.matches) apply(0, false)
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('scrollend', onScrollEnd)
    query.addEventListener('change', onBreakpoint)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('scrollend', onScrollEnd)
      query.removeEventListener('change', onBreakpoint)
      cancelAnimationFrame(frame)
      window.clearTimeout(settleTimer)
    }
  }, [ref, enabled, media, apply])

  return reveal
}
