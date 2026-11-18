import { ChevronDown } from 'lucide-react'
import { useId, useState } from 'react'
import { Section } from '@/components/layout/Section'
import { Chip } from '@/components/ui/Chip'
import { StatusDot } from '@/components/ui/StatusDot'
import { cases, type CaseFile } from '@/content/cases'
import { useNow } from '@/hooks/useNow'
import { cn } from '@/lib/cn'
import { formatDuration, formatMonth, monthsBetween, toYearMonth } from '@/lib/dates'

const pad = (n: number) => n.toString().padStart(2, '0')

function CaseRow({
  file,
  open,
  onToggle,
  currentMonth,
}: {
  file: CaseFile
  open: boolean
  onToggle: () => void
  currentMonth: string
}) {
  const baseId = useId()
  const buttonId = `${baseId}-button`
  const panelId = `${baseId}-panel`
  const active = file.status === 'active'
  const end = file.end ?? currentMonth
  const duration = formatDuration(monthsBetween(file.start, end))

  return (
    <li className="border-b border-line">
      <h3>
        <button
          id={buttonId}
          type="button"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={onToggle}
          className="group grid w-full grid-cols-[1fr_auto] items-start gap-x-4 gap-y-3 py-6 text-left md:grid-cols-12 md:items-center md:gap-8"
        >
          {/* Phone order: [ID · chip | chevron] / title / dates. Desktop: DOM order across 12 cols. */}
          <span className="order-1 flex flex-wrap items-center gap-3 md:order-none md:col-span-3">
            <span className="label text-fg-subtle">{file.id}</span>
            <Chip variant={active ? 'signal' : 'neutral'}>
              {active ? <StatusDot pulse /> : null}
              {active ? 'active' : 'closed'}
            </Chip>
          </span>

          <span className="order-3 col-span-2 md:order-none md:col-span-6">
            <span className="block font-display text-3xl leading-tight text-fg transition-colors group-hover:text-signal-strong md:text-4xl">
              {file.title}
            </span>
            <span className="mt-1 block text-sm text-fg-muted">
              {file.org} · {file.location}
            </span>
          </span>

          <span className="order-2 flex items-center justify-end gap-4 md:order-none md:col-span-3">
            <span className="hidden text-right md:block">
              <span className="block label text-fg-muted">
                {formatMonth(file.start)} → {file.end ? formatMonth(file.end) : 'now'}
              </span>
              <span className="block label text-fg-subtle">{duration}</span>
            </span>
            <span
              aria-hidden="true"
              className="grid size-8 shrink-0 place-items-center rounded-sm border border-line text-fg-subtle transition-colors group-hover:border-line-strong group-hover:text-fg"
            >
              <ChevronDown
                className={cn('size-4 transition-transform duration-300', open && 'rotate-180')}
              />
            </span>
          </span>

          <span className="order-4 col-span-2 -mt-1 label text-fg-subtle md:hidden">
            {formatMonth(file.start)} → {file.end ? formatMonth(file.end) : 'now'} · {duration}
          </span>
        </button>
      </h3>

      {/* grid-rows 0fr → 1fr animates height without measuring. `inert` keeps hidden content out of tab order. */}
      <section
        id={panelId}
        aria-labelledby={buttonId}
        inert={!open}
        className={cn(
          'grid transition-[grid-template-rows] duration-300 ease-out',
          open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
        )}
      >
        <div className="overflow-hidden">
          <div className="grid gap-8 pb-8 md:grid-cols-12">
            <dl className="grid grid-cols-[7rem_1fr] content-start gap-y-2 label text-fg-subtle md:col-span-3 md:grid-cols-1 md:gap-y-1">
              <dt>Classification</dt>
              <dd className="text-fg-muted md:mb-3">{file.classification}</dd>
              <dt>Status</dt>
              <dd className="text-fg-muted">{active ? 'Ongoing' : 'Closed'}</dd>
            </dl>

            <div className="md:col-span-9">
              <p className="text-lg text-fg">{file.summary}</p>
              <ol className="mt-5 space-y-3">
                {file.actions.map((action, i) => (
                  <li key={action} className="grid grid-cols-[2rem_1fr] gap-2 text-fg-muted">
                    <span className="pt-1 label text-signal">{pad(i + 1)}</span>
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
              <ul className="mt-6 flex flex-wrap gap-2" aria-label="Tags">
                {file.tags.map((tag) => (
                  <li key={tag}>
                    <Chip>{tag}</Chip>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>
    </li>
  )
}

export function CaseFilesSection() {
  const now = useNow()
  const currentMonth = toYearMonth(now)
  const [openIds, setOpenIds] = useState<ReadonlySet<string>>(
    () => new Set(cases.filter((c) => c.status === 'active').map((c) => c.id)),
  )

  const toggle = (id: string) =>
    setOpenIds((previous) => {
      const next = new Set(previous)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  const allOpen = openIds.size === cases.length

  return (
    <Section
      id="cases"
      title={
        <>
          Case <em className="text-fg-muted">files</em>
        </>
      }
      intro="Each role logged like an incident: what it was, what I handled, and how it closed."
    >
      <div className="mb-2 flex items-center justify-between label text-fg-subtle">
        <span>
          {cases.length} records · {cases.filter((c) => c.status === 'active').length} active
        </span>
        <button
          type="button"
          onClick={() => setOpenIds(allOpen ? new Set() : new Set(cases.map((c) => c.id)))}
          className="transition-colors hover:text-fg"
        >
          {allOpen ? 'Collapse all' : 'Expand all'}
        </button>
      </div>
      <ol className="border-t border-line">
        {cases.map((file) => (
          <CaseRow
            key={file.id}
            file={file}
            open={openIds.has(file.id)}
            onToggle={() => toggle(file.id)}
            currentMonth={currentMonth}
          />
        ))}
      </ol>
    </Section>
  )
}
