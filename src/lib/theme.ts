/**
 * Colour theme: dark by default, light on request. The choice lives in `data-theme` on <html>
 * (set before first paint by public/theme-init.js) and in localStorage.
 */
export type Theme = 'dark' | 'light'

export const THEME_STORAGE_KEY = 'theme'

/** Browser chrome colour per theme; matches `--color-canvas` in index.css. */
export const THEME_COLOR: Record<Theme, string> = {
  dark: '#0a0a0a',
  light: '#f4f4f2',
}

export function getTheme(): Theme {
  if (typeof document === 'undefined') return 'dark'
  return document.documentElement.dataset.theme === 'light' ? 'light' : 'dark'
}

export function setTheme(theme: Theme): void {
  const root = document.documentElement
  root.dataset.theme = theme
  root.style.colorScheme = theme
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', THEME_COLOR[theme])
  try {
    if (theme === 'light') localStorage.setItem(THEME_STORAGE_KEY, 'light')
    else localStorage.removeItem(THEME_STORAGE_KEY)
  } catch {
    // Storage blocked: the theme still applies for this visit.
  }
}

export function toggleTheme(): Theme {
  const next: Theme = getTheme() === 'dark' ? 'light' : 'dark'
  setTheme(next)
  return next
}

/**
 * Toggle with a circular reveal that grows from `origin` (the toggle button), using the View
 * Transitions API. Falls back to an instant switch without support, without an origin, or with
 * Reduce Motion on.
 */
export function toggleThemeFrom(origin?: { x: number; y: number }): Theme {
  const next: Theme = getTheme() === 'dark' ? 'light' : 'dark'
  const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
  if (!origin || reduce || typeof document.startViewTransition !== 'function') {
    setTheme(next)
    return next
  }

  const root = document.documentElement
  // Radius that reaches the farthest corner of the viewport from the origin.
  const radius = Math.hypot(
    Math.max(origin.x, window.innerWidth - origin.x),
    Math.max(origin.y, window.innerHeight - origin.y),
  )
  root.style.setProperty('--reveal-x', `${origin.x}px`)
  root.style.setProperty('--reveal-y', `${origin.y}px`)
  root.style.setProperty('--reveal-r', `${Math.ceil(radius)}px`)
  root.dataset.themeSwitch = ''

  const transition = document.startViewTransition(() => setTheme(next))
  void transition.finished.finally(() => {
    delete root.dataset.themeSwitch
  })
  return next
}

/** Calls `onChange` whenever `data-theme` changes on <html>, from any source. */
export function subscribeTheme(onChange: () => void): () => void {
  const observer = new MutationObserver(onChange)
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
  return () => observer.disconnect()
}
