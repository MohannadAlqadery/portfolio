import { ChevronDown } from 'lucide-react'
import type { MouseEvent } from 'react'
import { cn } from '@/lib/cn'
import { scrollToId } from '@/lib/scroll'
import type { Note } from './notes'

type TocProps = { toc: Note['toc']; activeId: string | null }

function useJump() {
  return (event: MouseEvent<HTMLAnchorElement>, id: string) => {
    event.preventDefault()
    scrollToId(id)
  }
}

/** Sticky "On this page" sidebar for wide screens, with the current section highlighted. */
export function TocSidebar({ toc, activeId }: TocProps) {
  const jump = useJump()
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

/** Collapsible "On this page" for phones and tablets. Native <details>: accessible, no JS needed. */
export function TocDisclosure({ toc }: { toc: Note['toc'] }) {
  const jump = useJump()
  return (
    <details className="group mt-8 rounded-md border border-line bg-surface lg:hidden">
      <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 label text-fg-muted [&::-webkit-details-marker]:hidden">
        On this page · {toc.length} sections
        <ChevronDown
          aria-hidden="true"
          className="size-4 transition-transform duration-200 group-open:rotate-180"
        />
      </summary>
      <nav aria-label="On this page" className="border-t border-line px-4 py-3">
        <ol className="space-y-1">
          {toc.map((item, i) => (
            <li key={item.id}>
              <a
                href={`#${item.id}`}
                onClick={(e) => {
                  jump(e, item.id)
                  e.currentTarget.closest('details')?.removeAttribute('open')
                }}
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
    </details>
  )
}
