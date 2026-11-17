import { Command as CommandIcon, Menu, X } from 'lucide-react'
import { useCallback, useId, useRef, useState, type MouseEvent } from 'react'
import { Container } from '@/components/ui/Container'
import { Kbd } from '@/components/ui/Kbd'
import { sections } from '@/content/sections'
import { site } from '@/content/site'
import { useCommandPalette } from '@/features/command-palette/context'
import { useActiveSection } from '@/hooks/useActiveSection'
import { useScrolled } from '@/hooks/useScrolled'
import { cn } from '@/lib/cn'
import { modKeyLabel } from '@/lib/platform'
import { scrollToId, scrollToTop } from '@/lib/scroll'
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
  const [modKey] = useState(modKeyLabel)

  const onNavClick = (event: MouseEvent<HTMLAnchorElement>, id: string) => {
    event.preventDefault()
    setMenuOpen(false)
    scrollToId(id)
  }

  // Stable identity: MobileMenu's effect depends on it and must not re-run (and refocus) per render.
  const closeMenu = useCallback((restoreFocus: boolean) => {
    setMenuOpen(false)
    if (restoreFocus) menuButtonRef.current?.focus()
  }, [])

  return (
    <>
      <header
        className={cn(
          'sticky top-0 z-40 border-b transition-colors duration-300',
          scrolled || menuOpen
            ? 'border-line bg-canvas/85 backdrop-blur-md'
            : 'border-transparent bg-transparent',
        )}
      >
        <Container className="flex h-14 items-center justify-between gap-6">
          <a
            href="#top"
            onClick={(e) => {
              e.preventDefault()
              setMenuOpen(false)
              scrollToTop()
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
                      href={`#${section.id}`}
                      onClick={(e) => onNavClick(e, section.id)}
                      aria-current={isActive ? 'location' : undefined}
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
            </ul>
          </nav>

          <div className="flex items-center gap-2">
            <LocalClock className="mr-2 hidden md:block" />
            <button
              type="button"
              onClick={() => setPaletteOpen(true)}
              className="flex h-8 items-center gap-1.5 rounded-sm border border-line px-2 text-fg-subtle transition-colors hover:border-line-strong hover:text-fg"
              aria-label="Open command palette"
              aria-keyshortcuts="Control+K Meta+K"
            >
              <CommandIcon aria-hidden="true" className="size-3.5 sm:hidden" />
              <span aria-hidden="true" className="hidden items-center gap-1 sm:flex">
                <Kbd className="border-0 bg-transparent px-0">{modKey}</Kbd>
                <Kbd className="border-0 bg-transparent px-0">K</Kbd>
              </span>
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
        {/* Reading progress, driven purely by CSS scroll timeline. */}
        <div
          aria-hidden="true"
          className="absolute inset-x-0 -bottom-px h-px scroll-progress bg-signal/70"
        />
      </header>

      {/*
        Rendered outside <header>: its backdrop-filter would otherwise become the containing block
        for this fixed-position panel and collapse it to the header's height.
      */}
      <MobileMenu
        id={menuId}
        open={menuOpen}
        activeId={active}
        onClose={closeMenu}
        onNavigate={onNavClick}
      />
    </>
  )
}
