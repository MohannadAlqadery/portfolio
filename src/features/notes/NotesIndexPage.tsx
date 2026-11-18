import { ArrowUpRight } from 'lucide-react'
import { useState } from 'react'
import { Chip } from '@/components/ui/Chip'
import { Container } from '@/components/ui/Container'
import { Link } from '@/components/ui/Link'
import { useDocumentMeta } from '@/hooks/useDocumentMeta'
import { cn } from '@/lib/cn'
import { formatDay, NOTES_DESCRIPTION, NOTES_TITLE } from './meta'
import { allTags, certCount, notePath, notes } from './notes'

export default function NotesIndexPage() {
  const [tag, setTag] = useState<string | null>(null)
  useDocumentMeta(NOTES_TITLE, NOTES_DESCRIPTION)

  const visible = tag ? notes.filter((note) => note.tags.includes(tag)) : notes

  return (
    <Container className="pt-16 pb-24 md:pt-24">
      <header className="max-w-3xl">
        {/* Plain count, deliberately not in the green "01 / 06" style used for homepage sections. */}
        <p className="label text-fg-subtle">
          Field notes · {certCount} {certCount === 1 ? 'certification' : 'certifications'}
        </p>
        <h1 className="mt-5 font-display text-display text-fg">
          Field <em className="text-fg-muted">notes</em>
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-pretty text-fg-muted">
          Study notes, queries and methodology from SOC work and certification prep. Practical,
          short, and written to be copied from.
        </p>
      </header>

      <fieldset className="mt-12 flex flex-wrap items-center gap-2">
        <legend className="sr-only">Filter by tag</legend>
        <button
          type="button"
          aria-pressed={tag === null}
          onClick={() => setTag(null)}
          className={cn(
            'h-7 rounded-sm border px-2.5 label transition-colors',
            tag === null
              ? 'border-signal/40 bg-signal-wash text-signal'
              : 'border-line text-fg-subtle hover:text-fg',
          )}
        >
          All
        </button>
        {allTags.map((name) => (
          <button
            key={name}
            type="button"
            aria-pressed={tag === name}
            onClick={() => setTag(tag === name ? null : name)}
            className={cn(
              'h-7 rounded-sm border px-2.5 label transition-colors',
              tag === name
                ? 'border-signal/40 bg-signal-wash text-signal'
                : 'border-line text-fg-subtle hover:text-fg',
            )}
          >
            {name}
          </button>
        ))}
      </fieldset>

      <ol className="mt-8 border-t border-line" aria-label="Notes" aria-live="polite">
        {visible.map((note) => (
          <li key={note.slug} className="border-b border-line">
            <Link
              to={notePath(note.slug)}
              className="group grid gap-x-8 gap-y-3 py-8 md:grid-cols-12 md:items-baseline"
            >
              <span className="label text-fg-subtle md:col-span-2">
                <time dateTime={note.date}>{formatDay(note.date)}</time>
                <span className="block">{note.readingMinutes} min read</span>
              </span>
              <span className="md:col-span-9">
                <span className="block font-display text-3xl leading-tight text-fg transition-colors group-hover:text-signal-strong md:text-4xl">
                  {note.title}
                </span>
                <span className="mt-3 block max-w-2xl leading-relaxed text-fg-muted">
                  {note.description}
                </span>
                <span className="mt-4 flex flex-wrap gap-2">
                  {note.tags.map((name) => (
                    <Chip key={name}>{name}</Chip>
                  ))}
                </span>
              </span>
              <span
                aria-hidden="true"
                className="hidden size-9 place-items-center justify-self-end rounded-sm border border-line text-fg-subtle transition-colors group-hover:border-signal/50 group-hover:text-signal md:col-span-1 md:grid"
              >
                <ArrowUpRight className="size-4" />
              </span>
            </Link>
          </li>
        ))}
      </ol>
    </Container>
  )
}
