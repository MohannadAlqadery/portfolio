import { useSyncExternalStore } from 'react'
import { getTheme, subscribeTheme, toggleTheme, type Theme } from '@/lib/theme'

const serverTheme = (): Theme => 'dark'

/** Current colour theme plus a toggle. Re-renders when the theme changes anywhere on the page. */
export function useTheme(): { theme: Theme; toggle: () => Theme } {
  const theme = useSyncExternalStore(subscribeTheme, getTheme, serverTheme)
  return { theme, toggle: toggleTheme }
}
