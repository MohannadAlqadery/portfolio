import { m, type Variants } from 'motion/react'
import { Section } from '@/components/layout/Section'
import { toolkit, type ToolkitItem } from '@/content/toolkit'
import { cn } from '@/lib/cn'

const totalItems = toolkit.reduce((sum, column) => sum + column.items.length, 0)

const column: Variants = {
  hidden: { opacity: 0, y: 32 },
  shown: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1], staggerChildren: 0.03 },
  },
}

const chip: Variants = {
  hidden: { opacity: 0, y: 6, filter: 'blur(4px)' },
  shown: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.4 } },
}

/**
 * Staggered offsets (lg: four columns) so the grid steps down left to right, like the reference
 * layout. Offsets apply per row position, so both rows step the same way.
 */
const stepDown = ['', 'lg:mt-8', 'lg:mt-16', 'lg:mt-24']

function Chip({ item }: { item: ToolkitItem }) {
  return (
    <m.li
      variants={chip}
      className={cn(
        'inline-flex h-8 items-center gap-1.5 rounded-sm border px-2.5 text-[0.8125rem] whitespace-nowrap transition-colors',
        item.core
          ? 'border-fg bg-fg font-medium text-canvas'
          : 'border-line-strong text-fg-muted hover:border-fg-subtle hover:text-fg',
        item.level === 'basics' && 'border-dashed',
      )}
    >
      {item.name}
      {item.core ? <span className="sr-only"> (used on shift)</span> : null}
      {item.level === 'basics' ? (
        <span className="label text-[0.5625rem] text-fg-subtle">basics</span>
      ) : null}
    </m.li>
  )
}

/** Skills as columns of chips: what I use on shift is filled, early-stage skills are dashed. */
export function ToolkitSection() {
  return (
    <Section
      id="toolkit"
      title={
        <>
          The <em>toolkit.</em>
        </>
      }
      intro={`${totalItems} tools and techniques in ${toolkit.length} areas, from day-to-day SOC work, certifications and hands-on labs.`}
    >
      <div className="grid gap-x-10 gap-y-14 sm:grid-cols-2 lg:grid-cols-4 lg:gap-y-20">
        {toolkit.map((group, i) => {
          const headingId = `toolkit-${group.id}`
          return (
            <m.section
              key={group.id}
              aria-labelledby={headingId}
              variants={column}
              initial="hidden"
              whileInView="shown"
              viewport={{ once: true, amount: 0.3 }}
              className={cn('border-t border-line-strong pt-5', stepDown[i % 4])}
            >
              <h3
                id={headingId}
                className="font-display text-xl leading-tight font-semibold tracking-tight text-fg"
              >
                {group.title}
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-fg-subtle">{group.summary}</p>
              <ul className="mt-5 flex flex-wrap gap-1.5">
                {group.items.map((item) => (
                  <Chip key={item.name} item={item} />
                ))}
              </ul>
            </m.section>
          )
        })}
      </div>

      <p className="mt-14 flex flex-wrap items-center gap-x-6 gap-y-2 label text-fg-subtle">
        <span className="flex items-center gap-2">
          <span aria-hidden="true" className="size-2.5 rounded-[2px] bg-fg" /> Used on shift
        </span>
        <span className="flex items-center gap-2">
          <span aria-hidden="true" className="size-2.5 rounded-[2px] border border-line-strong" />{' '}
          Hands-on
        </span>
        <span className="flex items-center gap-2">
          <span
            aria-hidden="true"
            className="size-2.5 rounded-[2px] border border-dashed border-fg-subtle"
          />{' '}
          Still building
        </span>
      </p>
    </Section>
  )
}
