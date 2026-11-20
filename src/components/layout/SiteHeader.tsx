import { Ellipsis, X } from 'lucide-react'
import { AnimatePresence } from 'motion/react'
import { useEffect, useId, useRef, useState, type MouseEvent } from 'react'
import { DecryptText } from '@/components/motion/DecryptText'
import { sections } from '@/content/sections'
import { useCommandPalette } from '@/features/command-palette/context'
import { useActiveSection } from '@/hooks/useActiveSection'
import { cn } from '@/lib/cn'
import { matchRoute, navigate, usePathname } from '@/lib/router'
import { goHome, goToSection } from '@/lib/scroll'
import { NavMenu } from './NavMenu'
import { ThemeToggle } from './ThemeToggle'

const sectionIds = sections.map((s) => s.id)
const pad = (n: number) => n.toString().padStart(2, '0')

/**
 * The fixed header spans the width. When a dialog locks scrolling (Ctrl K palette) the scrollbar
 * disappears and the viewport widens; pulling the right edge in by the scrollbar's width (see
 * trackScrollLockGap) keeps the centred pill exactly where it was.
 */
const HOLD_STILL = 'left-0 right-(--scroll-lock-gap,0px)'

/** "02 · Case files" for the section in view; the pill's small wayfinding label. */
function locationLabel(active: string | null, onNotes: boolean): string {
  if (onNotes) return '✎ · Field notes'
  const index = sections.findIndex((s) => s.id === active)
  const section = sections[index]
  return section ? `${pad(index + 1)} · ${section.label}` : '00 · Index'
}

export function SiteHeader() {
  const active = useActiveSection(sectionIds)
  const { setOpen: setPaletteOpen } = useCommandPalette()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuId = useId()
  const headerRef = useRef<HTMLElement>(null)
  const menuButtonRef = useRef<HTMLButtonElement>(null)
  const pathname = usePathname()
  const onNotes = pathname.startsWith('/notes')
  const onNote = matchRoute(pathname).name === 'note'

  // Close on Escape (focus back to the toggle), on a click outside, or when focus leaves.
  useEffect(() => {
    if (!menuOpen) return
    const header = headerRef.current
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      setMenuOpen(false)
      menuButtonRef.current?.focus()
    }
    const onPointerDown = (event: PointerEvent) => {
      if (header && !header.contains(event.target as Node)) setMenuOpen(false)
    }
    const onFocusOut = (event: FocusEvent) => {
      const next = event.relatedTarget as Node | null
      if (next && header && !header.contains(next)) setMenuOpen(false)
    }
    window.addEventListener('keydown', onKeyDown)
    document.addEventListener('pointerdown', onPointerDown)
    header?.addEventListener('focusout', onFocusOut)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      document.removeEventListener('pointerdown', onPointerDown)
      header?.removeEventListener('focusout', onFocusOut)
    }
  }, [menuOpen])

  const onNavClick = (event: MouseEvent<HTMLAnchorElement>, id: string) => {
    event.preventDefault()
    setMenuOpen(false)
    goToSection(id)
  }

  const onNotesClick = (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault()
    setMenuOpen(false)
    navigate('/notes')
  }

  const openPalette = () => {
    setMenuOpen(false)
    setPaletteOpen(true)
  }

  return (
    <>
      {onNote ? (
        // Reading progress on note pages: a fixed line at the top edge, driven by a CSS scroll
        // timeline (no JS).
        <div
          aria-hidden="true"
          data-testid="reading-progress"
          className={cn(
            'pointer-events-none fixed top-[env(safe-area-inset-top)] z-50 h-0.5 scroll-progress bg-signal',
            HOLD_STILL,
          )}
        />
      ) : null}
      <header
        ref={headerRef}
        className={cn(
          // A floating pill, centred near the top edge; only the pill itself takes clicks.
          'pointer-events-none fixed top-[calc(env(safe-area-inset-top)+0.75rem)] z-40 flex justify-center px-4',
          HOLD_STILL,
        )}
      >
        <div className="pointer-events-auto relative">
          <div className="flex h-11 items-center gap-1 rounded-xl border border-line bg-surface/80 p-1.5 shadow-lg shadow-black/20 backdrop-blur-md">
            <a
              href="/"
              onClick={(e) => {
                e.preventDefault()
                setMenuOpen(false)
                goHome()
              }}
              className="rounded-md px-2.5 py-1 font-display text-[0.9375rem] font-semibold tracking-tight text-fg transition-colors hover:bg-raised"
            >
              Mohannad<span className="text-fg-subtle">.</span>
            </a>

            {/* Where you are on the page; re-decrypts whenever the section changes. */}
            <span
              aria-hidden="true"
              className="hidden w-36 overflow-hidden border-l border-line pl-3 label whitespace-nowrap text-fg-subtle sm:block"
            >
              <DecryptText
                key={locationLabel(active, onNotes)}
                text={locationLabel(active, onNotes)}
                duration={500}
              />
            </span>

            <ThemeToggle className="ml-1" />

            <button
              ref={menuButtonRef}
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              aria-expanded={menuOpen}
              aria-controls={menuOpen ? menuId : undefined}
              className="grid size-8 place-items-center rounded-md bg-fg text-canvas transition-[transform,opacity] hover:opacity-85 active:scale-95"
            >
              <span className="sr-only">{menuOpen ? 'Close menu' : 'Open menu'}</span>
              <span aria-hidden="true" className="relative size-4">
                <Ellipsis
                  className={cn(
                    'absolute inset-0 size-4 transition-[opacity,rotate,scale] duration-300 ease-[var(--ease-out-expo)] motion-reduce:transition-none',
                    menuOpen ? 'scale-50 rotate-90 opacity-0' : 'opacity-100',
                  )}
                />
                <X
                  className={cn(
                    'absolute inset-0 size-4 transition-[opacity,rotate,scale] duration-300 ease-[var(--ease-out-expo)] motion-reduce:transition-none',
                    menuOpen ? 'opacity-100' : 'scale-50 -rotate-90 opacity-0',
                  )}
                />
              </span>
            </button>
          </div>

          <AnimatePresence>
            {menuOpen ? (
              <NavMenu
                id={menuId}
                activeId={onNotes ? null : active}
                notesActive={onNotes}
                onNavigate={onNavClick}
                onNotes={onNotesClick}
                onOpenPalette={openPalette}
              />
            ) : null}
          </AnimatePresence>
        </div>
      </header>
      {/* Keeps page content clear of the floating pill. */}
      <div aria-hidden="true" className="h-[calc(4.25rem+env(safe-area-inset-top))]" />
    </>
  )
}
