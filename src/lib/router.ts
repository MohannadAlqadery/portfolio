import { useSyncExternalStore } from 'react'
import { flushSync } from 'react-dom'
import { getSmoothScroll } from './smooth-scroll'

/**
 * Minimal client-side router for a handful of paths. History API + a custom event, no dependency.
 * During pre-rendering, `setServerPath` supplies the path because there is no `window`.
 */

const NAVIGATE_EVENT = 'app:navigate'
let serverPath = '/'

export function setServerPath(path: string): void {
  serverPath = path
}

/*
 * One shared pair of window listeners notifies every subscriber, so a back / forward between
 * pages starts exactly one transition (the same one links get), however many components read
 * the path.
 */
const listeners = new Set<() => void>()
let installed = false
let shownPath = '/'

const notify = () => listeners.forEach((listener) => listener())

function install() {
  if (installed) return
  installed = true
  shownPath = normalisePath(window.location.pathname)
  window.addEventListener('popstate', () => {
    const next = normalisePath(window.location.pathname)
    if (next === shownPath) {
      notify()
      return
    }
    shownPath = next
    withPageTransition(notify)
  })
  window.addEventListener(NAVIGATE_EVENT, () => {
    shownPath = normalisePath(window.location.pathname)
    notify()
  })
}

/** Calls `onChange` on every route change (link, back / forward). Returns an unsubscribe. */
export function subscribeToRoute(onChange: () => void): () => void {
  install()
  listeners.add(onChange)
  return () => {
    listeners.delete(onChange)
  }
}

/**
 * Path without a trailing slash (except the root) or a pre-rendered file name, so
 * `/notes.html` and `/index.html` resolve like `/notes` and `/` when served as static files.
 */
export function normalisePath(path: string): string {
  const clean = path.replace(/(?:\/index)?\.html$/, '')
  return clean.length > 1 ? clean.replace(/\/+$/, '') : clean || '/'
}

const getSnapshot = () => normalisePath(window.location.pathname)
// React also calls this in the browser while hydrating, so there it must be the real URL;
// only the pre-renderer (no `window`) uses the path it was given.
const getServerSnapshot = () =>
  typeof window === 'undefined' ? normalisePath(serverPath) : getSnapshot()

export function usePathname(): string {
  return useSyncExternalStore(subscribeToRoute, getSnapshot, getServerSnapshot)
}

/**
 * Page-change transitions. The route's code is preloaded first (see `setRoutePreloader`), then
 * the swap runs inside a View Transition: the old page fades and lifts away while the new one
 * rises in (CSS in index.css, scoped by `data-page-transition`). Without support, or with
 * Reduce Motion, pages switch instantly.
 */
let preloader: (path: string) => Promise<void> = () => Promise.resolve()
let pending = 0

export function setRoutePreloader(fn: (path: string) => Promise<void>): void {
  preloader = fn
}

function withPageTransition(update: () => void): void {
  const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
  if (reduce || typeof document.startViewTransition !== 'function') {
    update()
    return
  }
  const root = document.documentElement
  root.dataset.pageTransition = ''
  // flushSync: the new page must be in the DOM when the browser takes its "after" snapshot.
  const transition = document.startViewTransition(() => flushSync(update))
  // A newer navigation (e.g. Back pressed mid-transition) skips this one: the page is still
  // updated, only the animation is cut short, so the rejection is expected and safe to ignore.
  transition.ready.catch(() => {})
  void transition.finished.finally(() => {
    delete root.dataset.pageTransition
  })
}

/** Jump (no animation) to the top, or to `#hash` when the new page has that element. */
function placeScroll(hash: string): void {
  const target = hash ? document.getElementById(decodeURIComponent(hash.slice(1))) : null
  const lenis = getSmoothScroll()
  if (target) {
    if (lenis) lenis.scrollTo(target, { immediate: true, force: true })
    else target.scrollIntoView({ block: 'start' })
  } else if (lenis) lenis.scrollTo(0, { immediate: true, force: true })
  else window.scrollTo({ top: 0, behavior: 'auto' })
}

/** Navigate within the app. `to` may include a `#hash`. */
export function navigate(to: string, { replace = false }: { replace?: boolean } = {}): void {
  const url = new URL(to, window.location.origin)
  const samePage = normalisePath(url.pathname) === normalisePath(window.location.pathname)
  const commit = () => {
    if (replace) history.replaceState(null, '', url)
    else history.pushState(null, '', url)
    window.dispatchEvent(new Event(NAVIGATE_EVENT))
  }

  if (samePage) {
    commit()
    return
  }

  // Load the next page's code before swapping, so the transition never shows a loading gap.
  // Only the latest navigation wins if several are started quickly.
  const id = ++pending
  void preloader(url.pathname).then(() => {
    if (id !== pending) return
    withPageTransition(() => {
      commit()
      placeScroll(url.hash)
    })
  })
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
