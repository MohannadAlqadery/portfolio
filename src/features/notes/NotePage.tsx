import { ArrowLeft, ArrowRight } from 'lucide-react'
import { useMemo } from 'react'
import { Chip } from '@/components/ui/Chip'
import { Container } from '@/components/ui/Container'
import { Link } from '@/components/ui/Link'
import { useActiveSection } from '@/hooks/useActiveSection'
import { useDocumentMeta } from '@/hooks/useDocumentMeta'
import NotFoundPage from '@/pages/NotFoundPage'
import { mdxComponents } from './mdx-components'
import { formatDay, NOT_FOUND_TITLE, noteTitle } from './meta'
import { TocDisclosure, TocSidebar } from './NoteToc'
import { findNote, neighbours, notePath, type Note } from './notes'

function NeighbourLink({ note, direction }: { note: Note; direction: 'older' | 'newer' }) {
  const Icon = direction === 'older' ? ArrowLeft : ArrowRight
  return (
    <Link
      to={notePath(note.slug)}
      className={`group flex flex-col gap-2 rounded-md border border-line p-5 transition-colors hover:border-line-strong ${direction === 'newer' ? 'sm:items-end sm:text-right' : ''}`}
    >
      <span className="inline-flex items-center gap-1.5 label text-fg-subtle">
        {direction === 'older' ? <Icon aria-hidden="true" className="size-3" /> : null}
        {direction === 'older' ? 'Previous note' : 'Next note'}
        {direction === 'newer' ? <Icon aria-hidden="true" className="size-3" /> : null}
      </span>
      <span className="font-display text-xl leading-snug text-fg transition-colors group-hover:text-signal-strong">
        {note.title}
      </span>
    </Link>
  )
}

export default function NotePage({ slug }: { slug: string }) {
  const note = findNote(slug)
  useDocumentMeta(note ? noteTitle(note) : NOT_FOUND_TITLE, note?.description)
  const sectionIds = useMemo(() => note?.toc.map((item) => item.id) ?? [], [note])
  const activeId = useActiveSection(sectionIds)

  if (!note) return <NotFoundPage />

  const { Content } = note
  const { older, newer } = neighbours(slug)

  return (
    <article className="pt-12 pb-24 md:pt-20">
      <Container className="grid gap-x-16 lg:grid-cols-[minmax(0,48rem)_15rem] lg:justify-between">
        <div className="min-w-0">
          <Link
            to="/notes"
            className="inline-flex items-center gap-2 label text-fg-subtle transition-colors hover:text-fg"
          >
            <ArrowLeft aria-hidden="true" className="size-3" />
            All field notes
          </Link>

          <header className="mt-10 border-b border-line pb-10">
            <p className="label text-fg-subtle">
              <time dateTime={note.date}>{formatDay(note.date)}</time>
              <span aria-hidden="true"> · </span>
              {note.readingMinutes} min read
              {note.cert ? (
                <>
                  <span aria-hidden="true"> · </span>
                  <span className="text-signal">{note.cert}</span>
                </>
              ) : null}
            </p>
            <h1 className="mt-5 font-display text-headline text-balance text-fg">{note.title}</h1>
            <p className="mt-6 text-lg leading-relaxed text-pretty text-fg-muted">
              {note.description}
            </p>
            <ul className="mt-6 flex flex-wrap gap-2" aria-label="Tags">
              {note.tags.map((tag) => (
                <li key={tag}>
                  <Chip>{tag}</Chip>
                </li>
              ))}
            </ul>
          </header>

          {note.toc.length > 2 ? <TocDisclosure toc={note.toc} /> : null}

          <div className="mt-6 text-[1.0625rem]">
            <Content components={mdxComponents} />
          </div>

          {older || newer ? (
            <nav
              aria-label="More notes"
              className="mt-16 grid gap-4 border-t border-line pt-10 sm:grid-cols-2"
            >
              {older ? <NeighbourLink note={older} direction="older" /> : <span />}
              {newer ? <NeighbourLink note={newer} direction="newer" /> : null}
            </nav>
          ) : null}
        </div>

        {note.toc.length > 2 ? (
          <aside className="hidden lg:block">
            <TocSidebar toc={note.toc} activeId={activeId} />
          </aside>
        ) : null}
      </Container>
    </article>
  )
}
