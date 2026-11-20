/**
 * Keeps `--scroll-lock-gap` on <html> equal to the page scrollbar's width while a dialog locks
 * scrolling (Radix marks <body> with data-scroll-locked), and 0 otherwise.
 *
 * When scrolling locks, the scrollbar disappears and the viewport widens; fixed, centred chrome
 * (the pill nav) pulls its right edge in by this gap so it stays exactly where it was. We measure
 * the width ourselves while unlocked, and set the variable from script rather than relying on an
 * ancestor attribute selector, which in testing didn't always re-apply when the lock started.
 */
export function trackScrollLockGap(): () => void {
  const root = document.documentElement
  const body = document.body
  let width = 0

  const locked = () => body.hasAttribute('data-scroll-locked')
  const measure = () => {
    if (!locked()) width = Math.max(0, window.innerWidth - root.clientWidth)
  }
  const sync = () => {
    root.style.setProperty('--scroll-lock-gap', locked() ? `${width}px` : '0px')
  }

  measure()
  sync()
  const onResize = () => {
    measure()
    sync()
  }
  window.addEventListener('resize', onResize)
  // Page height changes can add or remove the scrollbar without a resize event.
  const resizeObserver = new ResizeObserver(onResize)
  resizeObserver.observe(body)
  // Mutation callbacks run before the next paint, so the gap applies in the same frame.
  const lockObserver = new MutationObserver(sync)
  lockObserver.observe(body, { attributes: true, attributeFilter: ['data-scroll-locked'] })

  return () => {
    window.removeEventListener('resize', onResize)
    resizeObserver.disconnect()
    lockObserver.disconnect()
  }
}
