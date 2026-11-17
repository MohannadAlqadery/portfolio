import { Section } from '@/components/layout/Section'
import { Panel } from '@/components/ui/Panel'
import { Hero } from '@/features/hero/Hero'

/** Temporary body for sections that are filled in Phase 5. */
function Pending({ phase }: { phase: number }) {
  return (
    <Panel title="pending" meta={`phase ${phase}`} className="bg-dotgrid">
      <p className="font-mono text-sm text-fg-subtle">Content lands in phase {phase}.</p>
    </Panel>
  )
}

export function HomePage() {
  return (
    <>
      <Hero />

      <Section id="profile" title="Profile">
        <Pending phase={5} />
      </Section>
      <Section id="cases" title="Case files">
        <Pending phase={5} />
      </Section>
      <Section id="credentials" title="Credentials">
        <Pending phase={5} />
      </Section>
      <Section id="toolkit" title="Toolkit">
        <Pending phase={5} />
      </Section>
      <Section id="education" title="Education">
        <Pending phase={5} />
      </Section>
      <Section id="contact" title="Contact">
        <Pending phase={5} />
      </Section>
    </>
  )
}
