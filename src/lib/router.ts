import { useSyncExternalStore } from 'react'

/**
 * Minimal client-side router for a handful of paths. History API + a custom event, no dependency.
 * During pre-rendering, `setServerPath` supplies the path because there is no `window`.
 */

const NAVIGATE_EVENT = 'app:navigate'
let serverPath = '/'

export function setServerPath(path: string): void {
  serverPath = path
}

function subscribe(onChange: () => void) {
  window.addEventListener('popstate', onChange)
  window.addEventListener(NAVIGATE_EVENT, onChange)
  return () => {
    window.removeEventListener('popstate', onChange)
    window.removeEventListener(NAVIGATE_EVENT, onChange)
  }
}

/** Path without a trailing slash (except the root). */
export function normalisePath(path: string): string {
  return path.length > 1 ? path.replace(/\/+$/, '') : path
}

const getSnapshot = () => normalisePath(window.location.pathname)
// React also calls this in the browser while hydrating, so there it must be the real URL;
// only the pre-renderer (no `window`) uses the path it was given.
const getServerSnapshot = () =>
  typeof window === 'undefined' ? normalisePath(serverPath) : getSnapshot()

export function usePathname(): string {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}

/** Navigate within the app. `to` may include a `#hash`. */
export function navigate(to: string, { replace = false }: { replace?: boolean } = {}): void {
  const url = new URL(to, window.location.origin)
  const samePage = normalisePath(url.pathname) === normalisePath(window.location.pathname)
  if (replace) history.replaceState(null, '', url)
  else history.pushState(null, '', url)
  window.dispatchEvent(new Event(NAVIGATE_EVENT))
  if (!samePage && !url.hash) window.scrollTo({ top: 0, behavior: 'auto' })
}

export type Route =
  { name: 'home' } | { name: 'notes' } | { name: 'note'; slug: string } | { name: 'not-found' }

export function matchRoute(pathname: string): Route {
  const path = normalisePath(pathname)
  if (path === '/') return { name: 'home' }
  if (path === '/notes') return { name: 'notes' }
  const note = /^\/notes\/([a-z0-9-]+)$/.exec(path)
  if (note?.[1]) return { name: 'note', slug: note[1] }
  return { name: 'not-found' }
}

/** True for plain left clicks that the router should handle (not new-tab / modified clicks). */
export function isPlainClick(event: {
  button: number
  metaKey: boolean
  ctrlKey: boolean
  shiftKey: boolean
  altKey: boolean
  defaultPrevented: boolean
}): boolean {
  return (
    !event.defaultPrevented &&
    event.button === 0 &&
    !event.metaKey &&
    !event.ctrlKey &&
    !event.shiftKey &&
    !event.altKey
  )
}
