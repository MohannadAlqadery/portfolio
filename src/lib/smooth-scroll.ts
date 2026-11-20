import Lenis from 'lenis'

/**
 * Smooth (inertial) page scrolling with Lenis. Lenis drives the real document scroll, so native
 * scrollbars, CSS scroll-driven animations, `position: sticky` and IntersectionObserver keep
 * working. It never starts for people who prefer reduced motion, and touch keeps native scrolling.
 */
let instance: Lenis | null = null

export function getSmoothScroll(): Lenis | null {
  return instance
}

export function startSmoothScroll(): () => void {
  // No matchMedia means no real browser (tests, very old engines): keep native scrolling.
  const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)')
  if (instance || !reduce || reduce.matches) return () => {}

  const lenis = new Lenis({
    // Long, soft settle like the reference; still responsive to small wheel moves.
    lerp: 0.1,
    wheelMultiplier: 1,
    // Pause while something locks page scroll (menus and dialogs set overflow: hidden).
    autoToggle: true,
    // Let scrollable panels (command palette list, dialogs, code blocks) scroll themselves.
    allowNestedScroll: true,
    prevent: (node) => node.closest('[role="dialog"], [data-lenis-prevent]') !== null,
  })
  instance = lenis

  let frame = requestAnimationFrame(function raf(time) {
    lenis.raf(time)
    frame = requestAnimationFrame(raf)
  })

  return () => {
    cancelAnimationFrame(frame)
    lenis.destroy()
    instance = null
  }
}
