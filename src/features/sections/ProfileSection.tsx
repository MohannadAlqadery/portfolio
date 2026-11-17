import { Section } from '@/components/layout/Section'
import { Panel } from '@/components/ui/Panel'
import { profile } from '@/content/profile'

export function ProfileSection() {
  const [lead, ...rest] = profile.paragraphs

  return (
    <Section
      id="profile"
      title={
        <>
          Signal over <em className="text-fg-muted">noise</em>
        </>
      }
    >
      <div className="grid gap-10 lg:grid-cols-12 lg:gap-12">
        <div className="space-y-5 text-lg leading-relaxed text-pretty text-fg-muted lg:col-span-7">
          <p className="text-xl leading-relaxed text-fg">{lead}</p>
          {rest.map((paragraph) => (
            <p key={paragraph.slice(0, 24)}>{paragraph}</p>
          ))}
        </div>

        <Panel title="operator.profile" meta="read-only" className="self-start lg:col-span-5">
          <dl className="divide-y divide-line">
            {profile.facts.map((fact) => (
              <div
                key={fact.field}
                className="grid grid-cols-[6.5rem_1fr] gap-3 py-2.5 first:pt-0 last:pb-0"
              >
                <dt className="pt-0.5 label text-fg-subtle">{fact.field}</dt>
                <dd className="text-sm text-fg">{fact.value}</dd>
              </div>
            ))}
          </dl>
        </Panel>
      </div>
    </Section>
  )
}
