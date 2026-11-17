import { ArrowUpRight } from 'lucide-react'
import { Section } from '@/components/layout/Section'
import { credentials } from '@/content/credentials'
import { trackSpotlight } from '@/lib/spotlight'

const pad = (n: number) => n.toString().padStart(2, '0')

export function CredentialsSection() {
  const featured = credentials.filter((c) => c.featured)
  const others = credentials.filter((c) => !c.featured)

  return (
    <Section
      id="credentials"
      title={
        <>
          Evidence <em className="text-fg-muted">on file</em>
        </>
      }
      intro="Certifications that back the day-to-day work, from the SOC side and the offensive side."
    >
      <ul className="grid gap-4 md:grid-cols-3">
        {featured.map((credential, i) => (
          <li key={credential.code}>
            <article
              onPointerMove={trackSpotlight}
              className="group spotlight flex h-full min-h-60 flex-col rounded-md border border-line bg-surface p-5 transition-colors hover:border-line-strong"
            >
              <p className="flex items-center justify-between label text-fg-subtle">
                <span>
                  EVD-{pad(i + 1)} · {credential.issuer}
                </span>
                <span className="tabular-nums">{credential.year}</span>
              </p>
              <h3 className="mt-auto pt-10 font-display text-5xl leading-none text-fg transition-colors group-hover:text-signal-strong">
                {credential.code}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-fg-muted">{credential.name}</p>
              {credential.verifyUrl ? (
                <a
                  href={credential.verifyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-flex items-center gap-1 label text-fg-subtle hover:text-signal"
                >
                  Verify <ArrowUpRight aria-hidden="true" className="size-3" />
                  <span className="sr-only">{credential.code} (opens in a new tab)</span>
                </a>
              ) : null}
            </article>
          </li>
        ))}
      </ul>

      <ul className="mt-8 border-t border-line">
        {others.map((credential, i) => (
          // Phone: [EVD · year] / name / issuer. Desktop: EVD | name | issuer | year.
          // Auto-placement + `order` only: no explicit row/column starts to fight across breakpoints.
          <li
            key={credential.code}
            className="grid grid-cols-[1fr_auto] items-baseline gap-x-6 gap-y-1 border-b border-line py-4 md:grid-cols-[2fr_6fr_3fr_1fr]"
          >
            <span className="label text-fg-subtle">EVD-{pad(featured.length + i + 1)}</span>
            <span className="text-right label text-fg-subtle tabular-nums md:order-last">
              {credential.year}
            </span>
            <span className="col-span-2 text-fg md:col-span-1">{credential.name}</span>
            <span className="col-span-2 text-sm text-fg-muted md:col-span-1">
              {credential.issuer}
            </span>
          </li>
        ))}
      </ul>
    </Section>
  )
}
