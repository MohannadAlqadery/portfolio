import { useCallback, useEffect, useState, type RefObject } from 'react'

type Options = {
  /** Only active while this media query matches (e.g. phones and tablets). */
  media?: string
  /** Smoothing while following the scroll (ms). Small enough to feel attached to the page. */
  followMs?: number
  /** Smoothing when settling in or out after scrolling stops (ms); ~3x this to finish. */
  settleMs?: number
}

const reducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false

type Animator = {
  /** Ease towards `next` px hidden, with the given smoothing time constant (ms). */
  moveTo: (next: number, ms: number) => void
  /** Where it's heading, in px hidden. */
  target: () => number
  stop: () => void
  /** The element to move. */
  attach: (el: HTMLElement | null) => void
}

/** Eases an element's vertical offset towards a target, frame-rate independently. */
function createAnimator(): Animator {
  let element: HTMLElement | null = null
  let target = 0
  let current = 0
  let smoothing = 95
  let frame = 0
  let last = 0

  const write = () => {
    const el = element
    if (el) el.style.transform = current ? `translate3d(0, ${(-current).toFixed(2)}px, 0)` : ''
  }

  function tick(now: number) {
    const dt = last ? Math.min(now - last, 64) : 16
    last = now
    const gap = target - current
    if (Math.abs(gap) < 0.3) {
      current = target
      write()
      frame = 0
      last = 0
      return
    }
    current += gap * (1 - Math.exp(-dt / smoothing))
    write()
    frame = requestAnimationFrame(tick)
  }

  return {
    moveTo(next, ms) {
      target = next
      smoothing = ms
      if (reducedMotion()) {
        cancelAnimationFrame(frame)
        frame = 0
        current = next
        write()
        return
      }
      if (!frame) frame = requestAnimationFrame(tick)
    },
    target: () => target,
    attach(el) {
      element = el
    },
    stop() {
      cancelAnimationFrame(frame)
      frame = 0
      last = 0
    },
  }
}

/**
 * "Quick return" header, the way browser toolbars behave: it scrolls away with the page and comes
 * back as soon as you scroll up; if scrolling stops part-way, it settles fully in or out.
 *
 * All motion runs through one requestAnimationFrame loop that eases the header towards its target
 * position (exponential smoothing, frame-rate independent). Following, settling and revealing are
 * the same motion, so a flick, a stop or a change of direction blends instead of jumping, and it
 * never fights a CSS transition. Only `transform` is written (GPU-composited, no layout), and
 * React never re-renders on scroll. With Reduce Motion it moves without easing.
 *
 * Returns `reveal()` to bring it back (e.g. on keyboard focus).
 */
export function useQuickReturn(
  ref: RefObject<HTMLElement | null>,
  enabled: boolean,
  { media = '(max-width: 79.99rem)', followMs = 45, settleMs = 95 }: Options = {},
): () => void {
  // One animator per header for the component's lifetime.
  const [animator] = useState(createAnimator)
  const moveTo = animator.moveTo
  const target = animator.target

  const reveal = useCallback(() => moveTo(0, settleMs), [moveTo, settleMs])

  useEffect(() => {
    const el = ref.current
    animator.attach(el)
    // No matchMedia (e.g. some test environments): leave the header in place.
    if (!el || typeof window.matchMedia !== 'function') return
    const query = window.matchMedia(media)

    if (!enabled || !query.matches) {
      moveTo(0, settleMs)
      const onChange = () => moveTo(0, settleMs)
      query.addEventListener('change', onChange)
      return () => query.removeEventListener('change', onChange)
    }

    const scrollY = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight
      // Rubber-banding reports positions past either end; treat those as the end itself.
      return Math.min(Math.max(window.scrollY, 0), Math.max(max, 0))
    }

    let lastY = scrollY()
    let settleTimer = 0

    const follow = () => {
      const y = scrollY()
      const delta = y - lastY
      lastY = y
      if (delta === 0) return
      const height = el.offsetHeight
      // Near the very top it's always fully shown; otherwise it tracks the scroll, clamped.
      const next = y <= 0 ? 0 : Math.min(Math.max(target() + delta, 0), height)
      if (next !== target()) moveTo(next, followMs)
    }

    const settle = () => {
      const height = el.offsetHeight
      if (target() === 0 || target() === height) return
      // Within a header's height of the top, or mostly shown: come back. Otherwise: go.
      const show = scrollY() <= height || target() < height / 2
      moveTo(show ? 0 : height, settleMs)
    }

    const onScroll = () => {
      follow()
      // `scrollend` isn't everywhere yet (older iOS); a short idle timer covers it.
      window.clearTimeout(settleTimer)
      settleTimer = window.setTimeout(settle, 140)
    }
    const onScrollEnd = () => {
      window.clearTimeout(settleTimer)
      follow()
      settle()
    }
    const onBreakpoint = () => {
      if (!query.matches) moveTo(0, settleMs)
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('scrollend', onScrollEnd)
    query.addEventListener('change', onBreakpoint)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('scrollend', onScrollEnd)
      query.removeEventListener('change', onBreakpoint)
      window.clearTimeout(settleTimer)
    }
  }, [ref, animator, enabled, media, followMs, settleMs, moveTo, target])

  // Stop any running animation on unmount.
  useEffect(() => animator.stop, [animator])

  return reveal
}
