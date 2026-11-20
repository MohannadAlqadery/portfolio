import { lazy, Suspense, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { CommandPaletteContext } from './context'

// The palette (and cmdk) are a separate chunk: fetched when the browser is idle after load, so
// the first Ctrl K opens instantly without weighing on the initial page load.
const loadPalette = () => import('./CommandPalette')
const CommandPalette = lazy(loadPalette)

function isEditable(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  return target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)
}

export function CommandPaletteProvider({ children }: { children: ReactNode }) {
  const [open, setOpenState] = useState(false)
  // Keep the palette mounted after first use so its close animation and state survive.
  const [hasOpened, setHasOpened] = useState(false)

  const setOpen = useCallback((next: boolean) => {
    if (next) setHasOpened(true)
    setOpenState(next)
  }, [])

  useEffect(() => {
    const idle = window.requestIdleCallback ?? ((cb: () => void) => window.setTimeout(cb, 2000))
    const handle = idle(() => void loadPalette())
    return () => (window.cancelIdleCallback ?? window.clearTimeout)(handle)
  }, [])

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const isShortcut = (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k'
      const isSlash = event.key === '/' && !isEditable(event.target)
      if (isShortcut || isSlash) {
        event.preventDefault()
        setHasOpened(true)
        setOpenState((value) => !value)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  const value = useMemo(() => ({ open, setOpen }), [open, setOpen])

  return (
    <CommandPaletteContext.Provider value={value}>
      {children}
      {hasOpened ? (
        <Suspense fallback={null}>
          <CommandPalette open={open} onOpenChange={setOpen} />
        </Suspense>
      ) : null}
    </CommandPaletteContext.Provider>
  )
}
