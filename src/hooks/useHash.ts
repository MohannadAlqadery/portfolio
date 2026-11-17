import { useSyncExternalStore } from 'react'

function subscribe(onChange: () => void) {
  window.addEventListener('hashchange', onChange)
  return () => window.removeEventListener('hashchange', onChange)
}

const getSnapshot = () => window.location.hash
const getServerSnapshot = () => ''

/** Current `location.hash`, kept in sync with navigation. */
export function useHash(): string {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}
