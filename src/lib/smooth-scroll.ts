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
    // Let scrollable panels (command palette list, dialogs, code blocks) scroll themselves.
    allowNestedScroll: true,
    prevent: (node) => node.closest('[role="dialog"], [data-lenis-prevent]') !== null,
  })
  instance = lenis

  // Pause while something locks page scroll: the mobile menu sets overflow: hidden on <html>, and
  // Radix dialogs (command palette) mark <body> with data-scroll-locked. Lenis would otherwise
  // keep scrolling the page behind them.
  const { documentElement: root, body } = document
  const syncLock = () => {
    const locked = body.hasAttribute('data-scroll-locked') || root.style.overflow === 'hidden'
    if (locked) lenis.stop()
    else lenis.start()
  }
  const lockObserver = new MutationObserver(syncLock)
  lockObserver.observe(root, { attributes: true, attributeFilter: ['style'] })
  lockObserver.observe(body, { attributes: true, attributeFilter: ['data-scroll-locked', 'style'] })

  let frame = requestAnimationFrame(function raf(time) {
    lenis.raf(time)
    frame = requestAnimationFrame(raf)
  })

  return () => {
    lockObserver.disconnect()
    cancelAnimationFrame(frame)
    lenis.destroy()
    instance = null
  }
}
