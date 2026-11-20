import { SquareTerminal } from 'lucide-react'
import { AnimatePresence } from 'motion/react'
import { lazy, Suspense, useCallback, useEffect, useId, useRef, useState } from 'react'
import { cn } from '@/lib/cn'

// The panel and its answers only load the first time someone opens it.
const TerminalPanel = lazy(() => import('./TerminalPanel'))

function isEditable(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  return target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)
}

/** The "Ask" pill in the corner and the terminal it opens. Backtick (`) toggles it too. */
export function AskTerminal() {
  const id = useId()
  const buttonRef = useRef<HTMLButtonElement>(null)
  const [open, setOpen] = useState(false)

  const close = useCallback(() => {
    setOpen(false)
    buttonRef.current?.focus({ preventScroll: true })
  }, [])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== '`' || event.metaKey || event.ctrlKey || event.altKey) return
      if (isEditable(event.target)) return
      event.preventDefault()
      setOpen((v) => !v)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={open ? id : undefined}
        aria-keyshortcuts="`"
        className={cn(
          'fixed right-4 bottom-[calc(env(safe-area-inset-bottom)+1rem)] z-40 inline-flex h-9 items-center gap-2 rounded-full border px-3.5 font-mono text-xs shadow-lg shadow-black/30 transition-colors',
          open
            ? 'border-line-strong bg-surface text-fg'
            : 'border-fg bg-fg text-canvas hover:bg-fg/90',
        )}
      >
        <SquareTerminal aria-hidden="true" className="size-4" />
        Ask
        <span className="sr-only"> the terminal about my work</span>
      </button>
      <AnimatePresence>
        {open ? (
          <Suspense fallback={null}>
            <TerminalPanel id={id} onClose={close} />
          </Suspense>
        ) : null}
      </AnimatePresence>
    </>
  )
}
