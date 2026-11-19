import type { ReactNode } from 'react'
import { Container } from '@/components/ui/Container'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { sectionCount, sectionIndex, sections, type SectionId } from '@/content/sections'
import { cn } from '@/lib/cn'

type SectionProps = {
  id: SectionId
  title: ReactNode
  /** Supporting copy under the headline. */
  intro?: ReactNode
  children?: ReactNode
  className?: string
}

/** Indexed page section: anchor target, labelled landmark and editorial header. */
export function Section({ id, title, intro, children, className }: SectionProps) {
  const headingId = `${id}-title`
  const kicker = sections.find((s) => s.id === id)?.label ?? id

  return (
    <section
      id={id}
      aria-labelledby={headingId}
      className={cn(
        'scroll-mt-[calc(3.5rem+env(safe-area-inset-top))] py-20 outline-none md:py-28',
        className,
      )}
    >
      <Container>
        <SectionHeader
          index={sectionIndex(id)}
          total={sectionCount}
          kicker={kicker}
          title={title}
          headingId={headingId}
        >
          {intro}
        </SectionHeader>
        {children ? <div className="mt-10 reveal md:mt-14">{children}</div> : null}
      </Container>
    </section>
  )
}
