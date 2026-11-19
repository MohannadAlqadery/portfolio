import { ChevronDown } from 'lucide-react'
import { useId, useRef, useState, type MouseEvent } from 'react'
import { cn } from '@/lib/cn'
import { prefersReducedMotion, scrollToId } from '@/lib/scroll'
import type { Note } from './notes'

type TocProps = { toc: Note['toc']; activeId: string | null }

/**
 * iOS-style sheet curve: a quick start and a long, soft settle, so the panel glides rather than
 * snaps. Used for the height, the chevron and the items, so they move as one.
 */
const EASE = 'ease-[cubic-bezier(0.32,0.72,0,1)]'

/** Sticky "On this page" sidebar for wide screens, with the current section highlighted. */
export function TocSidebar({ toc, activeId }: TocProps) {
  const jump = (event: MouseEvent<HTMLAnchorElement>, id: string) => {
    event.preventDefault()
    scrollToId(id)
  }
  return (
    <nav
      aria-label="On this page"
      className="sticky top-24 hidden max-h-[calc(100svh-8rem)] overflow-y-auto lg:block"
    >
      <p className="label text-fg-subtle">On this page</p>
      <ol className="mt-4 space-y-1 border-l border-line">
        {toc.map((item) => {
          const active = activeId === item.id
          return (
            <li key={item.id}>
              <a
                href={`#${item.id}`}
                onClick={(e) => jump(e, item.id)}
                aria-current={active ? 'location' : undefined}
                className={cn(
                  '-ml-px block border-l py-1.5 pl-4 text-sm leading-snug transition-colors',
                  active
                    ? 'border-signal text-fg'
                    : 'border-transparent text-fg-subtle hover:text-fg-muted',
                )}
              >
                {item.text}
              </a>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

/**
 * Collapsible "On this page" for phones and tablets: the WAI-ARIA disclosure pattern (a button
 * with aria-expanded controlling a region). The region animates its height with the
 * `grid-template-rows: 0fr → 1fr` technique, which works in every modern browser without measuring
 * in JS, and is `inert` while closed so its links can't be tabbed to or read out.
 */
export function TocDisclosure({ toc }: { toc: Note['toc'] }) {
  const [open, setOpen] = useState(false)
  const panelId = useId()
  const panelRef = useRef<HTMLDivElement>(null)

  const jump = (event: MouseEvent<HTMLAnchorElement>, id: string) => {
    event.preventDefault()
    setOpen(false)
    const panel = panelRef.current
    if (!panel || prefersReducedMotion()) {
      requestAnimationFrame(() => scrollToId(id))
      return
    }
    // Scroll once the list has finished closing: it sits above the content, so scrolling while
    // it shrinks would land short of the heading.
    let done = false
    const go = () => {
      if (done) return
      done = true
      panel.removeEventListener('transitionend', onEnd)
      scrollToId(id)
    }
    const onEnd = (e: TransitionEvent) => {
      if (e.target === panel) go()
    }
    panel.addEventListener('transitionend', onEnd)
    window.setTimeout(go, 600)
  }

  return (
    <div className="mt-8 rounded-md border border-line bg-surface lg:hidden">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between rounded-md px-4 py-3 text-left label text-fg-muted transition-colors hover:text-fg"
      >
        On this page · {toc.length} sections
        <ChevronDown
          aria-hidden="true"
          className={cn(
            'size-4 transition-[rotate] duration-[450ms] motion-reduce:transition-none',
            EASE,
            open && 'rotate-180',
          )}
        />
      </button>
      {/*
        Height glides over 450ms. The contents fade in a beat after the panel starts opening (so
        text isn't squashed into a sliver), and fade out quickly when closing (so the panel never
        shrinks over visible text).
      */}
      <div
        ref={panelRef}
        id={panelId}
        inert={!open}
        className={cn(
          'grid transition-[grid-template-rows] duration-[450ms] motion-reduce:transition-none',
          EASE,
          open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
        )}
      >
        <div className="min-h-0 overflow-hidden">
          <nav
            aria-label="On this page"
            className={cn(
              'border-t border-line px-4 py-3 transition-opacity motion-reduce:transition-none',
              open
                ? 'opacity-100 delay-100 duration-300 ease-out'
                : 'opacity-0 duration-150 ease-in',
            )}
          >
            <ol className="space-y-1">
              {toc.map((item, i) => (
                <li
                  key={item.id}
                  // Items settle into place with the panel, each a few ms after the one above.
                  style={{ transitionDelay: open ? `${60 + i * 18}ms` : '0ms' }}
                  className={cn(
                    'transition-[translate] duration-[450ms] motion-reduce:transition-none',
                    EASE,
                    open ? 'translate-y-0' : '-translate-y-1.5',
                  )}
                >
                  <a
                    href={`#${item.id}`}
                    onClick={(e) => jump(e, item.id)}
                    className="flex gap-3 py-1.5 text-sm text-fg-muted hover:text-fg"
                  >
                    <span className="w-5 shrink-0 font-mono text-[0.6875rem] leading-5 text-fg-subtle">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    {item.text}
                  </a>
                </li>
              ))}
            </ol>
          </nav>
        </div>
      </div>
    </div>
  )
}
