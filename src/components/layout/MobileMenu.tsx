import { useEffect, useRef, type MouseEvent } from 'react'
import { Container } from '@/components/ui/Container'
import { sections } from '@/content/sections'
import { site } from '@/content/site'
import { cn } from '@/lib/cn'
import { LocalClock } from './LocalClock'

type MobileMenuProps = {
  id: string
  open: boolean
  activeId: string | null
  /** `restoreFocus` is true when the menu closed via keyboard (Esc). */
  onClose: (restoreFocus: boolean) => void
  onNavigate: (event: MouseEvent<HTMLAnchorElement>, id: string) => void
  notesActive: boolean
  onNotes: (event: MouseEvent<HTMLAnchorElement>) => void
}

const pad = (n: number) => n.toString().padStart(2, '0')

/** Full-height section index for small screens. Hidden from `xl` up, where the inline nav shows. */
export function MobileMenu({
  id,
  open,
  activeId,
  onClose,
  onNavigate,
  notesActive,
  onNotes,
}: MobileMenuProps) {
  const firstLinkRef = useRef<HTMLAnchorElement>(null)

  useEffect(() => {
    if (!open) return

    firstLinkRef.current?.focus()
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose(true)
    }
    const desktop = window.matchMedia?.('(min-width: 80rem)')
    const onBreakpoint = (event: MediaQueryListEvent) => {
      if (event.matches) onClose(false)
    }

    window.addEventListener('keydown', onKeyDown)
    desktop?.addEventListener('change', onBreakpoint)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', onKeyDown)
      desktop?.removeEventListener('change', onBreakpoint)
    }
  }, [open, onClose])

  return (
    <div
      id={id}
      hidden={!open}
      // Starts below the header (3.5rem + status bar / island) and keeps clear of the home indicator.
      className="fixed inset-x-0 top-[calc(3.5rem+env(safe-area-inset-top))] bottom-0 z-30 overflow-y-auto bg-canvas xl:hidden"
    >
      <Container className="flex min-h-full flex-col justify-between pt-8 pb-[max(2rem,env(safe-area-inset-bottom))]">
        <nav aria-label="Sections">
          <ul className="divide-y divide-line border-y border-line">
            {sections.map((section, i) => (
              <li key={section.id}>
                <a
                  ref={i === 0 ? firstLinkRef : undefined}
                  href={`/#${section.id}`}
                  onClick={(e) => onNavigate(e, section.id)}
                  aria-current={activeId === section.id ? 'location' : undefined}
                  className="flex items-baseline gap-4 py-4"
                >
                  <span
                    className={cn(
                      'label',
                      activeId === section.id ? 'text-signal' : 'text-fg-subtle',
                    )}
                  >
                    {pad(i + 1)}
                  </span>
                  <span className="font-display text-4xl text-fg">{section.label}</span>
                </a>
              </li>
            ))}
            <li>
              <a
                href="/notes"
                onClick={onNotes}
                aria-current={notesActive ? 'page' : undefined}
                className="flex items-baseline gap-4 py-4"
              >
                <span className={cn('label', notesActive ? 'text-signal' : 'text-fg-subtle')}>
                  ✎
                </span>
                <span className="font-display text-4xl text-fg">
                  Field <em className="text-fg-muted">notes</em>
                </span>
              </a>
            </li>
          </ul>
        </nav>

        <div className="mt-10 flex items-end justify-between gap-4">
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
      </Container>
    </div>
  )
}
