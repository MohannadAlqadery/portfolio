import { Section } from '@/components/layout/Section'
import { Container } from '@/components/ui/Container'
import { Panel } from '@/components/ui/Panel'
import { site } from '@/content/site'

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
      {/* Hero placeholder: replaced by the KQL console hero in Phase 4. */}
      <section aria-label="Introduction" className="relative">
        <Container className="flex min-h-[calc(100svh-3.5rem)] flex-col justify-end pt-16 pb-16 md:pb-24">
          <p className="label text-fg-subtle">{site.location.coordinates}</p>
          <h1 className="mt-6 font-display text-display text-balance text-fg">
            {site.name.split(' ')[0]} <em className="text-fg-muted">{site.name.split(' ')[1]}</em>
          </h1>
          <p className="mt-6 max-w-xl text-lg text-pretty text-fg-muted">
            {site.role} in {site.location.city}. Hero console arrives in phase 4.
          </p>
        </Container>
      </section>

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
