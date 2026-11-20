import { AnimatePresence, m } from 'motion/react'
import { useEffect, useId, useRef, useState, type MouseEvent } from 'react'
import { Section } from '@/components/layout/Section'
import { cases } from '@/content/cases'
import { useNow } from '@/hooks/useNow'
import { cn } from '@/lib/cn'
import { formatMonth, toYearMonth } from '@/lib/dates'
import { navigate } from '@/lib/router'
import { getSmoothScroll } from '@/lib/smooth-scroll'
import { CaseSheet } from './case-files/CaseSheet'
import { FolderCaption, FolderShell } from './case-files/CaseFolder'

// Note files are only listed here (no content is loaded): the folder shows their names.
const noteFiles = Object.keys(import.meta.glob('/src/content/notes/*.mdx')).map(
  (path) => path.split('/').pop() ?? path,
)

const folderClass =
  'group/folder block w-full rounded-lg text-left outline-offset-4 focus-visible:outline-2'

export function CaseFilesSection() {
  const now = useNow()
  const currentMonth = toYearMonth(now)
  const sheetId = useId()
  const sheetRef = useRef<HTMLDivElement>(null)
  const [openId, setOpenId] = useState<string | null>(
    () => cases.find((c) => c.status === 'active')?.id ?? null,
  )
  const [interacted, setInteracted] = useState(false)
  const open = cases.find((c) => c.id === openId) ?? null

  // After picking a folder, bring the sheet into view if it opened below the fold (phones).
  useEffect(() => {
    if (!interacted || !openId) return
    const sheet = sheetRef.current
    if (!sheet || sheet.getBoundingClientRect().top < window.innerHeight * 0.7) return
    const lenis = getSmoothScroll()
    if (lenis) lenis.scrollTo(sheet, { offset: -96 })
    else sheet.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [openId, interacted])

  const select = (id: string) => {
    setInteracted(true)
    setOpenId((current) => (current === id ? null : id))
  }

  const openNotes = (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault()
    navigate('/notes')
  }

  return (
    <Section
      id="cases"
      title={
        <>
          Case <em>files.</em>
        </>
      }
      intro="Each role logged like an incident: what it was, what I handled, and how it closed. Open a folder to read the case."
    >
      <ul className="grid grid-cols-2 gap-x-5 gap-y-10 lg:grid-cols-4 lg:gap-x-8">
        {cases.map((file) => {
          const isOpen = openId === file.id
          return (
            <li key={file.id}>
              <button
                type="button"
                onClick={() => select(file.id)}
                aria-expanded={isOpen}
                aria-controls={sheetId}
                data-open={isOpen}
                className={folderClass}
              >
                <FolderShell
                  title={file.shortTitle ?? file.title}
                  open={isOpen}
                  icon="open"
                  papers={{
                    heading: `${file.id} · report`,
                    lines: file.excerpt,
                    stamp: file.status,
                  }}
                />
              </button>
              <FolderCaption>
                <span className="truncate">
                  {file.org.replace(/ LLC$/, '')} · {file.classification}
                </span>
                <span className={cn('shrink-0', file.status === 'active' && 'text-fg')}>
                  {file.end ? formatMonth(file.end).slice(-4) : 'now'}
                </span>
              </FolderCaption>
            </li>
          )
        })}
        <li>
          <a href="/notes" onClick={openNotes} className={folderClass}>
            <FolderShell
              title="Field notes"
              icon="link"
              papers={{ heading: 'notes · write-ups', lines: noteFiles, stamp: 'public' }}
            />
          </a>
          <FolderCaption>
            <span>{noteFiles.length} write-ups</span>
            <span className="shrink-0">read ↗</span>
          </FolderCaption>
        </li>
      </ul>

      <div ref={sheetRef} id={sheetId} className="mt-12 scroll-mt-24 md:mt-16">
        <AnimatePresence mode="wait" initial={false}>
          {open ? (
            <m.div
              key={open.id}
              initial={{ opacity: 0, y: 18, filter: 'blur(6px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -10, filter: 'blur(4px)', transition: { duration: 0.18 } }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            >
              <CaseSheet file={open} currentMonth={currentMonth} />
            </m.div>
          ) : (
            <m.p
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="rounded-xl border border-dashed border-line-strong p-8 text-center label text-fg-subtle"
            >
              No case open. Pick a folder to read it.
            </m.p>
          )}
        </AnimatePresence>
      </div>
    </Section>
  )
}
