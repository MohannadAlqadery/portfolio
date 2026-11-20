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

/** Calls `onChange` whenever `data-theme` changes on <html>, from any source. */
export function subscribeTheme(onChange: () => void): () => void {
  const observer = new MutationObserver(onChange)
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
  return () => observer.disconnect()
}
