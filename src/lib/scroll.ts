function prefersReducedMotion(): boolean {
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
}

/**
 * Scroll to an element by id and record it in the URL without adding history entries.
 * Moves focus to the target so keyboard and screen-reader users land in the right place.
 */
export function scrollToId(id: string): void {
  const target = document.getElementById(id)
  if (!target) return

  target.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'start' })
  if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1')
  target.focus({ preventScroll: true })
  history.replaceState(null, '', `#${id}`)
}

export function scrollToTop(): void {
  window.scrollTo({ top: 0, behavior: prefersReducedMotion() ? 'auto' : 'smooth' })
  history.replaceState(null, '', window.location.pathname + window.location.search)
}
