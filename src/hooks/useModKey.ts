import { useSyncExternalStore } from 'react'
import { modKeyLabel } from '@/lib/platform'

const noop = () => () => {}

/**
 * "⌘" on Apple devices, "Ctrl" elsewhere. Pre-rendered HTML always says "Ctrl" (the server
 * snapshot), and React swaps in the real label right after hydration, without a mismatch.
 */
export function useModKey(): string {
  return useSyncExternalStore(noop, modKeyLabel, () => 'Ctrl')
}
