import { Section } from '@/components/layout/Section'
import { toolkit } from '@/content/toolkit'

const totalItems = toolkit.reduce((sum, column) => sum + column.items.length, 0)

/** Skills as an ATT&CK-style matrix: tactics across the top, techniques beneath. */
export function ToolkitSection() {
  return (
    <Section
      id="toolkit"
      title={
        <>
          The <em className="text-fg-muted">matrix</em>
        </>
      }
      intro={`${totalItems} techniques across ${toolkit.length} tactics, laid out the way ATT&CK lays out an adversary.`}
    >
      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-md border border-line bg-line sm:grid-cols-3 xl:grid-cols-6">
        {toolkit.map((column) => {
          const headingId = `toolkit-${column.id}`
          return (
            <section
              key={column.id}
              aria-labelledby={headingId}
              className="group/col flex flex-col bg-canvas"
            >
              <div className="border-b border-line bg-raised px-3 py-3">
                <h3 id={headingId} className="text-sm text-fg">
                  {column.title}
                </h3>
                <p className="mt-1 label text-fg-subtle">
                  {column.items.length} {column.items.length === 1 ? 'technique' : 'techniques'}
                </p>
              </div>
              <ul className="flex flex-1 flex-col gap-1.5 p-2">
                {column.items.map((item) => (
                  <li
                    key={item.name}
                    className="flex min-h-10 items-center justify-between gap-2 rounded-sm border border-line bg-surface px-2.5 py-2 text-[0.8125rem] text-fg-muted transition-colors group-hover/col:border-line-strong hover:!border-signal/60 hover:text-fg"
                  >
                    <span>{item.name}</span>
                    {item.level === 'basics' ? (
                      <span className="shrink-0 label text-[0.625rem] text-fg-subtle">Basics</span>
                    ) : null}
                  </li>
                ))}
              </ul>
            </section>
          )
        })}
      </div>
      <p className="mt-4 label text-fg-subtle">
        Cells marked <span className="text-fg-muted">Basics</span> are skills I’m still building.
      </p>
    </Section>
  )
}
