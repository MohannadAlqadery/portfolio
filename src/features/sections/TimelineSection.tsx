import { m, useScroll, useTransform, type MotionValue } from 'motion/react'
import { useRef } from 'react'
import { Section } from '@/components/layout/Section'
import { Chip } from '@/components/ui/Chip'
import { StatusDot } from '@/components/ui/StatusDot'
import { education } from '@/content/education'
import { KIND_LABEL, timeline, type TimelineEntry } from '@/content/timeline'
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion'
import { cn } from '@/lib/cn'
import { formatMonth } from '@/lib/dates'

const pad = (n: number) => n.toString().padStart(2, '0')
const count = timeline.length

/*
 * Desktop: a wave across the page, drawn as you scroll, with a node per entry alternating high
 * and low. The SVG stretches horizontally (preserveAspectRatio="none") while node positions use
 * the same percentages, so curve and nodes always line up; the stroke keeps its width.
 * Every entry's text starts on one baseline below the wave, clear of the curve.
 * Phones: a straight vertical line through the nodes (entries vary in height, so a curve
 * wouldn't meet them), drawn the same way.
 */
const BAND = 120 // px height of the wave band
const HIGH = 24
const LOW = 96
const nodeY = (i: number) => (i % 2 === 0 ? HIGH : LOW)
const nodeX = (i: number) => ((i + 0.5) / count) * 1000 // in the 0–1000 viewBox

/** Smooth wave through every node, with flat tangents at each one. */
function wavePath(): string {
  const points = timeline.map((_, i) => [nodeX(i), nodeY(i)] as const)
  const [first] = points
  if (!first) return ''
  let d = `M 0 ${first[1]} L ${first[0]} ${first[1]}`
  for (let i = 1; i < points.length; i++) {
    const [x0, y0] = points[i - 1] ?? first
    const [x1, y1] = points[i] ?? first
    const mid = (x1 - x0) / 2
    d += ` C ${x0 + mid} ${y0} ${x1 - mid} ${y1} ${x1} ${y1}`
  }
  const last = points.at(-1) ?? first
  return `${d} L 1000 ${last[1]}`
}

function Node({
  entry,
  progress,
  at,
  reduced,
}: {
  entry: TimelineEntry
  progress: MotionValue<number>
  at: number
  reduced: boolean
}) {
  // Each node switches on as the drawn line reaches it.
  const on = useTransform(progress, [Math.max(0, at - 0.04), at + 0.02], [0, 1])
  const scale = useTransform(on, [0, 1], [0.4, 1])
  return (
    <m.span
      aria-hidden="true"
      style={reduced ? {} : { opacity: on, scale }}
      className={cn('grid size-5 place-items-center rounded-full border-2 bg-canvas', 'border-fg')}
    >
      <span
        className={cn('size-1.5 rounded-full', entry.current ? 'animate-blink bg-fg' : 'bg-fg')}
      />
    </m.span>
  )
}

function EntryText({ entry, index }: { entry: TimelineEntry; index: number }) {
  return (
    <>
      <p className="flex flex-wrap items-center gap-2">
        {entry.current ? (
          <Chip variant="signal">
            <StatusDot tone="signal" pulse /> Active
          </Chip>
        ) : (
          <Chip>{KIND_LABEL[entry.kind]}</Chip>
        )}
        <span className="label text-fg-subtle">{pad(index + 1)}</span>
      </p>
      <p className="mt-3 label text-fg-muted">{entry.when}</p>
      <h3 className="mt-2 font-display text-lg leading-tight font-semibold tracking-tight text-fg xl:text-xl">
        {entry.title}
      </h3>
      <p className="mt-1 text-sm text-fg-muted">{entry.org}</p>
      <p className="mt-2 text-xs leading-relaxed text-fg-subtle">{entry.detail}</p>
    </>
  )
}

function Trace() {
  const ref = useRef<HTMLDivElement>(null)
  const reduced = usePrefersReducedMotion()
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 0.85', 'end 0.6'] })
  const drawn = useTransform(scrollYProgress, [0, 1], [0, 1])
  const pathStyle = reduced ? {} : { pathLength: drawn }
  const phoneHeight = count * 168

  return (
    <div ref={ref}>
      {/* Desktop and tablet landscape: horizontal wave. */}
      <div className="hidden lg:block">
        <div aria-hidden="true" className="relative" style={{ height: BAND }}>
          <svg
            viewBox={`0 0 1000 ${BAND}`}
            preserveAspectRatio="none"
            className="absolute inset-0 size-full overflow-visible"
          >
            <path
              d={wavePath()}
              fill="none"
              className="stroke-line-strong"
              strokeWidth={1}
              vectorEffect="non-scaling-stroke"
            />
            <m.path
              d={wavePath()}
              fill="none"
              className="stroke-fg-muted"
              strokeWidth={1.5}
              vectorEffect="non-scaling-stroke"
              style={pathStyle}
            />
          </svg>
        </div>
        <ol
          className="relative grid"
          style={{ marginTop: -BAND, gridTemplateColumns: `repeat(${count}, minmax(0, 1fr))` }}
        >
          {timeline.map((entry, i) => (
            <li key={entry.id} className="relative px-3" style={{ paddingTop: BAND + 16 }}>
              <span
                className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2"
                style={{ top: nodeY(i) }}
              >
                <Node entry={entry} progress={drawn} at={(i + 0.5) / count} reduced={reduced} />
              </span>
              <EntryText entry={entry} index={i} />
            </li>
          ))}
        </ol>
      </div>

      {/* Phones and tablets: vertical wave on the left. */}
      <ol className="relative lg:hidden" style={{ minHeight: phoneHeight }}>
        <svg
          aria-hidden="true"
          viewBox={`0 0 24 ${phoneHeight}`}
          preserveAspectRatio="none"
          className="absolute top-0 left-0 h-full w-6 overflow-visible"
        >
          <path
            d={`M 12 0 L 12 ${phoneHeight}`}
            fill="none"
            className="stroke-line-strong"
            strokeWidth={1}
            vectorEffect="non-scaling-stroke"
          />
          <m.path
            d={`M 12 0 L 12 ${phoneHeight}`}
            fill="none"
            className="stroke-fg-muted"
            strokeWidth={1.5}
            vectorEffect="non-scaling-stroke"
            style={pathStyle}
          />
        </svg>
        {timeline.map((entry, i) => (
          <li
            key={entry.id}
            className="relative pb-10 pl-12"
            style={{ minHeight: phoneHeight / count }}
          >
            <span className="absolute top-0 left-[2px]">
              <Node entry={entry} progress={drawn} at={i / count + 0.02} reduced={reduced} />
            </span>
            <EntryText entry={entry} index={i} />
          </li>
        ))}
      </ol>
    </div>
  )
}

function Groundwork() {
  return (
    <div className="mt-20 grid gap-10 border-t border-line pt-10 lg:mt-28 lg:grid-cols-12 lg:gap-12">
      <div className="lg:col-span-5">
        <p className="label text-fg-subtle">Groundwork</p>
        <h3 className="mt-3 font-display text-2xl leading-tight font-bold tracking-tight text-fg md:text-3xl">
          {education.degree}
        </h3>
        <p className="mt-2 text-fg-muted">
          {education.school} · {education.location}
        </p>
        <p className="mt-1 label text-fg-subtle">
          {formatMonth(education.start)} → {formatMonth(education.end)} · {education.result}
        </p>
        <p className="mt-4 text-sm leading-relaxed text-fg-muted">{education.summary}</p>
      </div>
      <ol className="grid gap-x-8 sm:grid-cols-2 lg:col-span-7">
        {education.coursework.map((course, i) => (
          <li key={course.name} className="border-b border-line py-4">
            <p className="flex items-baseline gap-3">
              <span className="label text-fg-subtle">{pad(i + 1)}</span>
              <span className="text-fg">{course.name}</span>
            </p>
            <p className="mt-1 pl-8 text-sm leading-relaxed text-fg-muted">{course.detail}</p>
          </li>
        ))}
      </ol>
    </div>
  )
}

export function TimelineSection() {
  return (
    <Section
      id="timeline"
      title={
        <>
          Signal <em>trace.</em>
        </>
      }
      intro="Roles, study and certifications on one line, newest first: from the first logs I read to the shift I work now."
    >
      <Trace />
      <Groundwork />
    </Section>
  )
}
