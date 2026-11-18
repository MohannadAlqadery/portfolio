import { useSyncExternalStore } from 'react'

/**
 * A shared minute clock. One timer for the whole app, aligned to minute boundaries, and a cached
 * Date per minute so `useSyncExternalStore` sees a stable snapshot.
 */
let current: Date | null = null
let timer: ReturnType<typeof setTimeout> | undefined
const listeners = new Set<() => void>()

function getSnapshot(): Date {
  const now = Date.now()
  if (!current || Math.floor(now / 60_000) !== Math.floor(current.getTime() / 60_000)) {
    current = new Date(now)
  }
  return current
}

function schedule() {
  timer = setTimeout(
    () => {
      listeners.forEach((listener) => listener())
      schedule()
    },
    60_000 - (Date.now() % 60_000),
  )
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  if (listeners.size === 1) schedule()
  return () => {
    listeners.delete(listener)
    if (listeners.size === 0) clearTimeout(timer)
  }
}

/** Current time, refreshed on each minute boundary (enough for an HH:mm clock or a date check). */
export function useNow(): Date {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
}

/**
 * Same clock, but `null` in pre-rendered HTML and during hydration, so build-time output never
 * disagrees with the visitor's clock. Use for anything rendered on pre-rendered pages.
 */
export function useHydratedNow(): Date | null {
  return useSyncExternalStore(subscribe, getSnapshot, () => null)
}
