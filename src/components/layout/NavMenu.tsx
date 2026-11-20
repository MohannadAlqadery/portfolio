import { m, type Variants } from 'motion/react'
import { useEffect, useRef, type MouseEvent } from 'react'
import { Kbd } from '@/components/ui/Kbd'
import { sections } from '@/content/sections'
import { site } from '@/content/site'
import { useModKey } from '@/hooks/useModKey'
import { cn } from '@/lib/cn'
import { LocalClock } from './LocalClock'

type NavMenuProps = {
  id: string
  activeId: string | null
  notesActive: boolean
  onNavigate: (event: MouseEvent<HTMLAnchorElement>, id: string) => void
  onNotes: (event: MouseEvent<HTMLAnchorElement>) => void
  onOpenPalette: () => void
}

const pad = (n: number) => n.toString().padStart(2, '0')

const panel: Variants = {
  closed: { opacity: 0, y: -10, scale: 0.96, filter: 'blur(6px)' },
  open: {
    opacity: 1,
    y: 0,
    scale: 1,
    filter: 'blur(0px)',
    transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1], staggerChildren: 0.035 },
  },
  exit: {
    opacity: 0,
    y: -6,
    scale: 0.98,
    filter: 'blur(4px)',
    transition: { duration: 0.16, ease: [0.4, 0, 1, 1] },
  },
}

const row: Variants = {
  closed: { opacity: 0, y: 8 },
  open: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } },
}

const linkClass =
  'group flex items-baseline gap-3 rounded-md px-3 py-2 transition-colors hover:bg-raised focus-visible:bg-raised'

/**
 * Site index that drops out of the pill nav: sections, field notes, the command palette and
 * contact. Rendered only while open (inside AnimatePresence), so it animates in and out.
 */
export function NavMenu({
  id,
  activeId,
  notesActive,
  onNavigate,
  onNotes,
  onOpenPalette,
}: NavMenuProps) {
  const firstLinkRef = useRef<HTMLAnchorElement>(null)
  const modKey = useModKey()

  useEffect(() => {
    firstLinkRef.current?.focus({ preventScroll: true })
  }, [])

  return (
    <m.div
      id={id}
      variants={panel}
      initial="closed"
      animate="open"
      exit="exit"
      className="absolute top-full left-1/2 mt-2 w-[min(22rem,calc(100vw-2rem))] origin-top -translate-x-1/2 overflow-hidden rounded-xl border border-line bg-surface/95 shadow-2xl shadow-black/40 backdrop-blur-md"
    >
      <nav aria-label="Sections" className="p-2">
        <ul>
          {sections.map((section, i) => {
            const active = activeId === section.id
            return (
              <m.li key={section.id} variants={row}>
                <a
                  ref={i === 0 ? firstLinkRef : undefined}
                  href={`/#${section.id}`}
                  onClick={(e) => onNavigate(e, section.id)}
                  aria-current={active ? 'location' : undefined}
                  className={linkClass}
                >
                  <span className={cn('w-5 shrink-0 label', active ? 'text-fg' : 'text-fg-subtle')}>
                    {pad(i + 1)}
                  </span>
                  <span
                    className={cn(
                      'font-display text-2xl font-semibold tracking-tight transition-colors',
                      active ? 'text-fg' : 'text-fg-muted group-hover:text-fg',
                    )}
                  >
                    {section.label}
                  </span>
                </a>
              </m.li>
            )
          })}
          <m.li variants={row}>
            <a
              href="/notes"
              onClick={onNotes}
              aria-current={notesActive ? 'page' : undefined}
              className={linkClass}
            >
              <span
                className={cn('w-5 shrink-0 label', notesActive ? 'text-fg' : 'text-fg-subtle')}
              >
                ✎
              </span>
              <span
                className={cn(
                  'font-display text-2xl font-semibold tracking-tight transition-colors',
                  notesActive ? 'text-fg' : 'text-fg-muted group-hover:text-fg',
                )}
              >
                Field notes
              </span>
            </a>
          </m.li>
        </ul>
      </nav>

      <m.div variants={row} className="space-y-3 border-t border-line p-3">
        <button
          type="button"
          onClick={onOpenPalette}
          aria-keyshortcuts="Control+K Meta+K"
          className="flex w-full items-center justify-between rounded-md border border-line px-3 py-2 text-sm text-fg-muted transition-colors hover:border-line-strong hover:text-fg"
        >
          <span>Search and commands</span>
          {/* Keyboard hint only where there is likely a keyboard. */}
          <span className="flex items-center gap-1 pointer-coarse:hidden">
            <Kbd>{modKey}</Kbd>
            <Kbd>K</Kbd>
          </span>
          <span className="sr-only"> command palette</span>
        </button>
        <div className="flex items-center justify-between gap-4 px-1">
          <LocalClock />
          <a
            href={site.links.linkedin}
            target="_blank"
            rel="noopener noreferrer"
            className="link-underline pb-0.5 label text-fg-muted hover:text-fg"
          >
            LinkedIn ↗
          </a>
        </div>
      </m.div>
    </m.div>
  )
}
