import { Chip } from '@/components/ui/Chip'
import { StatusDot } from '@/components/ui/StatusDot'
import type { CaseFile } from '@/content/cases'
import { formatDuration, formatMonth, monthsBetween } from '@/lib/dates'

const pad = (n: number) => n.toString().padStart(2, '0')

/** The open case: metadata on the left, what happened on the right. */
export function CaseSheet({ file, currentMonth }: { file: CaseFile; currentMonth: string }) {
  const active = file.status === 'active'
  const end = file.end ?? currentMonth
  const range = `${formatMonth(file.start)} → ${file.end ? formatMonth(file.end) : 'now'}`
  const duration = formatDuration(monthsBetween(file.start, end))

  return (
    <article className="grid gap-10 rounded-xl border border-line bg-surface p-6 md:grid-cols-12 md:gap-12 md:p-10">
      <div className="md:col-span-4">
        <p className="flex flex-wrap items-center gap-3 label text-fg-subtle">
          {file.id}
          <Chip variant={active ? 'signal' : 'neutral'}>
            {active ? <StatusDot tone="signal" pulse /> : null}
            {active ? 'active' : 'closed'}
          </Chip>
        </p>
        <h3 className="mt-4 font-display text-3xl leading-[1.05] font-bold tracking-tight text-fg md:text-4xl">
          {file.title}
        </h3>
        <dl className="mt-6 grid grid-cols-[7.5rem_1fr] gap-y-2 text-sm">
          <dt className="label text-fg-subtle">Organisation</dt>
          <dd className="text-fg">{file.org}</dd>
          <dt className="label text-fg-subtle">Location</dt>
          <dd className="text-fg-muted">{file.location}</dd>
          <dt className="label text-fg-subtle">Opened</dt>
          <dd className="text-fg-muted">{range}</dd>
          <dt className="label text-fg-subtle">Duration</dt>
          <dd className="text-fg-muted">{duration}</dd>
          <dt className="label text-fg-subtle">Class</dt>
          <dd className="text-fg-muted">{file.classification}</dd>
        </dl>
      </div>

      <div className="md:col-span-8">
        <p className="text-xl leading-snug text-fg">{file.summary}</p>
        <ol className="mt-6 space-y-4">
          {file.actions.map((action, i) => (
            <li key={action} className="grid grid-cols-[2rem_1fr] gap-2 text-fg-muted">
              <span className="pt-1 label text-fg-subtle">{pad(i + 1)}</span>
              <span className="leading-relaxed">{action}</span>
            </li>
          ))}
        </ol>
        {file.note ? (
          <p className="mt-6 border-l-2 border-sev-medium/60 pl-4 text-sm text-fg-muted">
            <span className="mr-2 label text-sev-medium">Note</span>
            {file.note}
          </p>
        ) : null}
        <ul className="mt-8 flex flex-wrap gap-2" aria-label="Tags">
          {file.tags.map((tag) => (
            <li key={tag}>
              <Chip>{tag}</Chip>
            </li>
          ))}
        </ul>
      </div>
    </article>
  )
}
