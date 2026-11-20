import { ScrollRevealText } from '@/components/motion/ScrollRevealText'
import { Section } from '@/components/layout/Section'
import { profile } from '@/content/profile'

export function ProfileSection() {
  const [lead, ...rest] = profile.paragraphs

  return (
    <Section
      id="profile"
      title={
        <>
          Signal <em>over noise.</em>
        </>
      }
      intro="How I work a shift, and how compliance work led me into security operations."
    >
      <div className="grid gap-10 lg:grid-cols-12 lg:gap-12">
        {lead ? (
          <ScrollRevealText
            text={lead}
            className="font-display text-[clamp(1.5rem,3vw,2.6rem)] leading-[1.15] font-semibold tracking-[-0.02em] text-balance text-fg lg:col-span-11"
          />
        ) : null}
        <div className="space-y-5 text-lg leading-relaxed text-pretty text-fg-muted lg:col-span-6 lg:col-start-7">
          {rest.map((paragraph) => (
            <p key={paragraph.slice(0, 24)}>{paragraph}</p>
          ))}
        </div>
      </div>

      {/* Spec sheet: one fact per cell, hairlines between them. */}
      <dl className="mt-16 grid grid-cols-2 border-t border-line md:mt-24 md:grid-cols-3">
        {profile.facts.map((fact) => (
          <div key={fact.field} className="border-b border-line py-5 pr-4">
            <dt className="label text-fg-subtle">{fact.field}</dt>
            <dd className="mt-2 text-sm text-fg md:text-base">{fact.value}</dd>
          </div>
        ))}
      </dl>
    </Section>
  )
}
