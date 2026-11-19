import { Menu, X } from 'lucide-react'
import { useCallback, useId, useRef, useState, type MouseEvent } from 'react'
import { Container } from '@/components/ui/Container'
import { Kbd } from '@/components/ui/Kbd'
import { sections } from '@/content/sections'
import { site } from '@/content/site'
import { useCommandPalette } from '@/features/command-palette/context'
import { useActiveSection } from '@/hooks/useActiveSection'
import { useHideOnScroll } from '@/hooks/useHideOnScroll'
import { useScrolled } from '@/hooks/useScrolled'
import { cn } from '@/lib/cn'
import { useModKey } from '@/hooks/useModKey'
import { matchRoute, navigate, usePathname } from '@/lib/router'
import { goHome, goToSection } from '@/lib/scroll'
import { LocalClock } from './LocalClock'
import { MobileMenu } from './MobileMenu'

const sectionIds = sections.map((s) => s.id)
const pad = (n: number) => n.toString().padStart(2, '0')

export function SiteHeader() {
  const scrolled = useScrolled()
  const active = useActiveSection(sectionIds)
  const { setOpen: setPaletteOpen } = useCommandPalette()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuId = useId()
  const menuButtonRef = useRef<HTMLButtonElement>(null)
  const modKey = useModKey()
  const pathname = usePathname()
  const onNotes = pathname.startsWith('/notes')
  const onNote = matchRoute(pathname).name === 'note'
  const [headerHidden, revealHeader] = useHideOnScroll(!menuOpen)

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

  // Stable identity: MobileMenu's effect depends on it and must not re-run (and refocus) per render.
  const closeMenu = useCallback((restoreFocus: boolean) => {
    setMenuOpen(false)
    if (restoreFocus) menuButtonRef.current?.focus()
  }, [])

  return (
    <>
      {/*
        Top edge (phones and tablets). Safari 26 paints the area behind its status bar and toolbar
        from a fixed element touching the top edge (needs ≥80% width, ≥3px height and a background
        colour). This strip never moves, so Safari keeps the site's colour there even while the
        header below is slid away, and the header slides under it rather than into Safari's bar.
        Also covers the status bar / Island when the site runs edge to edge (home-screen app).
      */}
      <div
        aria-hidden="true"
        data-testid="top-edge"
        className="pointer-events-none fixed inset-x-0 top-0 z-50 h-[calc(env(safe-area-inset-top)+0.5rem)] bg-canvas xl:hidden"
      />
      {onNote ? (
        // Reading progress on note pages: its own fixed line at the top edge, independent of the
        // header, which slides underneath it. Driven by a CSS scroll timeline (no JS).
        <div
          aria-hidden="true"
          data-testid="reading-progress"
          className="pointer-events-none fixed inset-x-0 top-[env(safe-area-inset-top)] z-50 h-0.5 scroll-progress bg-signal"
        />
      ) : null}
      <header
        onFocusCapture={revealHeader}
        className={cn(
          // position: fixed (not sticky): Safari 26 only paints the area behind its status bar and
          // toolbar with a header's colour when the header is fixed to the top edge. Top padding
          // clears the status bar / Dynamic Island when the page runs edge to edge.
          // Phones and tablets: solid, slides away while reading and back on scroll up, in step
          // with Safari's own toolbar. Hiding is a touch quicker than showing.
          // Wide screens: always visible, translucent, and transparent over the hero until scrolled.
          // Tailwind's translate-* utilities set the `translate` property, so that's what animates.
          'fixed inset-x-0 top-0 z-40 border-b border-line bg-canvas pt-[env(safe-area-inset-top)] transition-[translate,background-color,border-color] duration-300 ease-[cubic-bezier(0.2,0,0,1)] motion-reduce:transition-none max-xl:will-change-[translate] xl:bg-canvas/90 xl:backdrop-blur-md',
          headerHidden && 'max-xl:-translate-y-full max-xl:duration-200',
          !(scrolled || menuOpen) &&
            'xl:border-transparent xl:bg-transparent xl:backdrop-blur-none',
        )}
      >
        <Container className="flex h-14 items-center justify-between gap-6">
          <a
            href="/"
            onClick={(e) => {
              e.preventDefault()
              setMenuOpen(false)
              goHome()
            }}
            className="group flex items-center gap-3"
          >
            <span
              aria-hidden="true"
              className="grid size-7 place-items-center rounded-sm border border-line-strong font-mono text-[0.6875rem] text-fg transition-colors group-hover:border-signal group-hover:text-signal"
            >
              {site.monogram}
            </span>
            <span className="text-sm whitespace-nowrap text-fg">
              {site.name}
              <span className="hidden text-fg-subtle sm:inline"> / {site.role}</span>
            </span>
          </a>

          <nav aria-label="Primary" className="hidden xl:block">
            <ul className="flex items-center gap-1">
              {sections.map((section, i) => {
                const isActive = active === section.id
                return (
                  <li key={section.id}>
                    <a
                      href={`/#${section.id}`}
                      onClick={(e) => onNavClick(e, section.id)}
                      aria-current={isActive && !onNotes ? 'location' : undefined}
                      className={cn(
                        'flex h-8 items-center gap-1.5 rounded-sm px-2.5 text-[0.8125rem] whitespace-nowrap transition-colors',
                        isActive ? 'text-fg' : 'text-fg-subtle hover:text-fg',
                      )}
                    >
                      <span
                        className={cn(
                          'font-mono text-[0.625rem]',
                          isActive ? 'text-signal' : 'text-fg-subtle',
                        )}
                      >
                        {pad(i + 1)}
                      </span>
                      {section.label}
                    </a>
                  </li>
                )
              })}
              <li aria-hidden="true" className="mx-1 h-4 w-px bg-line" />
              <li>
                <a
                  href="/notes"
                  onClick={onNotesClick}
                  aria-current={onNotes ? 'page' : undefined}
                  className={cn(
                    'flex h-8 items-center gap-1.5 rounded-sm px-2.5 text-[0.8125rem] whitespace-nowrap transition-colors',
                    onNotes ? 'text-fg' : 'text-fg-subtle hover:text-fg',
                  )}
                >
                  <span
                    className={cn(
                      'font-mono text-[0.625rem]',
                      onNotes ? 'text-signal' : 'text-fg-subtle',
                    )}
                  >
                    ✎
                  </span>
                  Notes
                </a>
              </li>
            </ul>
          </nav>

          <div className="flex items-center gap-2">
            <LocalClock className="mr-2 hidden md:block" />
            <button
              type="button"
              onClick={() => setPaletteOpen(true)}
              // Hidden on phones: it's a keyboard shortcut, and the menu already covers navigation.
              className="hidden h-8 items-center gap-1.5 rounded-sm border border-line px-2 text-fg-subtle transition-colors hover:border-line-strong hover:text-fg sm:flex"
              aria-keyshortcuts="Control+K Meta+K"
            >
              {/*
                Named by its content, starting with the visible shortcut ("Ctrl K command palette"),
                so voice-control users can activate it by saying what they see.
              */}
              <span className="flex items-center gap-1">
                <Kbd className="border-0 bg-transparent px-0">{modKey}</Kbd>{' '}
                <Kbd className="border-0 bg-transparent px-0">K</Kbd>
              </span>
              <span className="sr-only"> command palette</span>
            </button>
            <button
              ref={menuButtonRef}
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              aria-expanded={menuOpen}
              aria-controls={menuId}
              className="grid size-8 place-items-center rounded-sm border border-line text-fg-muted transition-colors hover:border-line-strong hover:text-fg xl:hidden"
            >
              <span className="sr-only">{menuOpen ? 'Close menu' : 'Open menu'}</span>
              {menuOpen ? (
                <X aria-hidden="true" className="size-4" />
              ) : (
                <Menu aria-hidden="true" className="size-4" />
              )}
            </button>
          </div>
        </Container>
      </header>
      {/* Holds the fixed header's space in the page flow, so content starts below it. */}
      <div aria-hidden="true" className="h-[calc(3.5rem+1px+env(safe-area-inset-top))]" />

      {/*
        Rendered outside <header>: its backdrop-filter would otherwise become the containing block
        for this fixed-position panel and collapse it to the header's height.
      */}
      <MobileMenu
        id={menuId}
        open={menuOpen}
        activeId={onNotes ? null : active}
        notesActive={onNotes}
        onClose={closeMenu}
        onNavigate={onNavClick}
        onNotes={onNotesClick}
      />
    </>
  )
}
