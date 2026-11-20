import { navigate, normalisePath } from './router'
import { getSmoothScroll } from './smooth-scroll'

export function prefersReducedMotion(): boolean {
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
}

/**
 * Scroll to an element by id and record it in the URL without adding history entries.
 * Moves focus to the target so keyboard and screen-reader users land in the right place.
 */
export function scrollToId(id: string): void {
  const target = document.getElementById(id)
  if (!target) return

  // With smooth scrolling on, let Lenis animate (it honours the target's scroll-margin-top).
  const lenis = getSmoothScroll()
  if (lenis) lenis.scrollTo(target)
  else
    target.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'start' })
  if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1')
  target.focus({ preventScroll: true })
  history.replaceState(null, '', `#${id}`)
}

export function scrollToTop(): void {
  const lenis = getSmoothScroll()
  if (lenis) lenis.scrollTo(0)
  else window.scrollTo({ top: 0, behavior: prefersReducedMotion() ? 'auto' : 'smooth' })
  history.replaceState(null, '', window.location.pathname + window.location.search)
}

const onHomePage = () => normalisePath(window.location.pathname) === '/'

/** Jump to a homepage section from anywhere: scrolls if already home, otherwise navigates. */
export function goToSection(id: string): void {
  if (onHomePage()) scrollToId(id)
  else navigate(`/#${id}`)
}

/** Back to the top of the homepage from anywhere. */
export function goHome(): void {
  if (onHomePage()) scrollToTop()
  else navigate('/')
}
