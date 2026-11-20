import { ArrowUpRight, Plus } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

/*
 * A dark document folder: back panel with a tab, papers tucked inside, and a frosted front
 * panel carrying the title. Hovering, focusing or opening it lifts and fans the papers out.
 * The papers are decoration (aria-hidden); the title and caption carry the meaning.
 */

/** Decorative paper contents, drawn from the case so each folder looks different. */
export type FolderPapers = {
  /** Header line on the light report page, e.g. "CASE-2608 · REPORT". */
  heading: string
  /** A few short mono lines for the dark page (query or log excerpt). */
  lines: string[]
  /** Stamp on the back page. */
  stamp: string
}

type FolderShellProps = {
  title: string
  papers: FolderPapers
  /** Lifted state while selected, not only on hover. */
  open?: boolean
  icon: 'open' | 'link'
}

function Papers({ papers }: { papers: FolderPapers }) {
  return (
    <div aria-hidden="true" className="absolute inset-x-[7%] top-[14%] bottom-[30%]">
      {/* Back: stamped page. */}
      <div className="absolute inset-0 origin-bottom-left translate-y-[6%] rounded-md border border-line-strong bg-raised transition-transform duration-500 ease-[var(--ease-out-expo)] group-hover/folder:-translate-y-[18%] group-hover/folder:-rotate-6 group-focus-visible/folder:-translate-y-[18%] group-focus-visible/folder:-rotate-6 group-data-[open=true]/folder:-translate-y-[18%] group-data-[open=true]/folder:-rotate-6">
        <span className="absolute top-[12%] right-[8%] rotate-[-8deg] rounded-[3px] border border-fg-subtle px-1.5 py-0.5 font-mono text-[0.5rem] tracking-widest text-fg-subtle uppercase">
          {papers.stamp}
        </span>
      </div>
      {/* Middle: dark page with a query excerpt. */}
      <div className="absolute inset-0 translate-x-[1.5%] translate-y-[3%] rounded-md border border-line-strong bg-surface p-[7%] transition-transform delay-[40ms] duration-500 ease-[var(--ease-out-expo)] group-hover/folder:-translate-y-[26%] group-hover/folder:rotate-2 group-focus-visible/folder:-translate-y-[26%] group-focus-visible/folder:rotate-2 group-data-[open=true]/folder:-translate-y-[26%] group-data-[open=true]/folder:rotate-2">
        {papers.lines.map((line, i) => (
          <p
            key={i}
            className="truncate font-mono text-[0.5rem] leading-[1.7] text-fg-subtle first:text-fg-muted"
          >
            {line}
          </p>
        ))}
      </div>
      {/* Front: light report page with redaction bars. */}
      <div className="absolute inset-0 translate-x-[3%] rounded-md bg-[#ecece8] p-[7%] shadow-lg shadow-black/30 transition-transform delay-[80ms] duration-500 ease-[var(--ease-out-expo)] group-hover/folder:-translate-y-[14%] group-hover/folder:rotate-[7deg] group-focus-visible/folder:-translate-y-[14%] group-focus-visible/folder:rotate-[7deg] group-data-[open=true]/folder:-translate-y-[14%] group-data-[open=true]/folder:rotate-[7deg]">
        <p className="truncate font-mono text-[0.5rem] font-semibold tracking-wider text-[#1a1a1a] uppercase">
          {papers.heading}
        </p>
        <div className="mt-[8%] space-y-[5%]">
          {[92, 70, 84, 46, 76].map((w, i) => (
            <span
              key={i}
              className={cn(
                'block h-[0.3rem] rounded-[1px]',
                i === 3 ? 'bg-[#1a1a1a]' : 'bg-[#c9c9c4]',
              )}
              style={{ width: `${w}%` }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

/** The folder graphic itself; wrapped by a button (cases) or a link (notes). */
export function FolderShell({ title, papers, open = false, icon }: FolderShellProps) {
  return (
    <span className="relative block aspect-[5/4] w-full [perspective:900px]">
      {/* Back panel with its tab. */}
      <span
        aria-hidden="true"
        className="absolute inset-x-0 top-[6%] bottom-0 rounded-lg border border-line-strong bg-raised"
      />
      <span
        aria-hidden="true"
        className="absolute top-0 left-0 h-[10%] w-[38%] rounded-t-lg border border-b-0 border-line-strong bg-raised"
      />

      <Papers papers={papers} />

      {/* Frosted front panel; tips back a little when the folder opens. */}
      <span
        className={cn(
          'absolute inset-x-0 bottom-0 flex h-[58%] origin-bottom items-end justify-between gap-3 rounded-lg border border-line-strong bg-surface/75 p-[6%] backdrop-blur-md transition-transform duration-500 ease-[var(--ease-out-expo)]',
          'group-hover/folder:[transform:rotateX(-14deg)] group-focus-visible/folder:[transform:rotateX(-14deg)]',
          open && '[transform:rotateX(-14deg)]',
        )}
      >
        <span className="font-display text-[0.9375rem] leading-tight font-semibold tracking-tight text-fg sm:text-lg lg:text-xl">
          {title}
        </span>
        <span
          aria-hidden="true"
          className={cn(
            'grid size-7 shrink-0 place-items-center rounded-md transition-colors',
            open ? 'bg-fg text-canvas' : 'bg-fg/90 text-canvas group-hover/folder:bg-fg',
          )}
        >
          {icon === 'link' ? (
            <ArrowUpRight className="size-4" />
          ) : (
            <Plus className={cn('size-4 transition-transform duration-300', open && 'rotate-45')} />
          )}
        </span>
      </span>
    </span>
  )
}

/** Caption row under a folder. */
export function FolderCaption({ children }: { children: ReactNode }) {
  return (
    <span className="mt-3 flex items-baseline justify-between gap-3 label text-fg-subtle">
      {children}
    </span>
  )
}
