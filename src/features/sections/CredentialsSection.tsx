import { ArrowUpRight } from 'lucide-react'
import { Section } from '@/components/layout/Section'
import { StatusDot } from '@/components/ui/StatusDot'
import { credentials } from '@/content/credentials'
import { useNow } from '@/hooks/useNow'
import { cn } from '@/lib/cn'
import { formatMonth } from '@/lib/dates'
import { trackSpotlight } from '@/lib/spotlight'

const pad = (n: number) => n.toString().padStart(2, '0')

export function CredentialsSection() {
  const today = useNow().toISOString().slice(0, 10)
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
      <ul className="grid min-w-0 gap-4 md:grid-cols-3">
        {featured.map((credential, i) => {
          const active = credential.expires ? credential.expires >= today : true
          return (
            <li key={credential.code} className="min-w-0">
              <article
                onPointerMove={trackSpotlight}
                className="group spotlight flex h-full flex-col rounded-md border border-line bg-surface transition-colors hover:border-line-strong"
              >
                <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 border-b border-line px-5 py-3 label text-fg-subtle">
                  <span>
                    EVD-{pad(i + 1)} · {credential.issuer}
                  </span>
                  {credential.expires ? (
                    <span
                      className={cn(
                        'inline-flex items-center gap-1.5',
                        active ? 'text-fg-muted' : 'text-fg-subtle',
                      )}
                    >
                      <StatusDot tone={active ? 'signal' : 'subtle'} pulse={active} />
                      {active ? 'Active' : 'Expired'}
                    </span>
                  ) : (
                    <span className="tabular-nums">{credential.year}</span>
                  )}
                </div>

                <div className="flex flex-1 flex-col p-5">
                  <div className="flex items-start justify-between gap-4">
                    <h3 className="pt-3 font-display text-4xl leading-none text-fg transition-colors group-hover:text-fg-muted min-[22.5rem]:text-5xl">
                      {credential.code}
                    </h3>
                    {credential.badge ? (
                      <img
                        src={credential.badge.src}
                        alt={credential.badge.alt}
                        width={80}
                        height={80}
                        loading="lazy"
                        decoding="async"
                        className="size-14 shrink-0 object-contain transition-transform duration-500 group-hover:scale-105 group-hover:-rotate-3 min-[22.5rem]:size-20"
                      />
                    ) : null}
                  </div>
                  <p className="mt-4 text-sm leading-relaxed text-fg-muted">{credential.name}</p>

                  {credential.issued ? (
                    <dl className="mt-auto grid grid-cols-2 gap-x-4 gap-y-3 pt-6 label">
                      <div>
                        <dt className="text-fg-subtle">Issued</dt>
                        <dd className="mt-0.5 text-fg-muted">
                          {formatMonth(credential.issued.slice(0, 7))}
                        </dd>
                      </div>
                      {credential.expires ? (
                        <div>
                          <dt className="text-fg-subtle">Expires</dt>
                          <dd className="mt-0.5 text-fg-muted">
                            {formatMonth(credential.expires.slice(0, 7))}
                          </dd>
                        </div>
                      ) : null}
                      {credential.credentialId ? (
                        <div className="col-span-2">
                          <dt className="text-fg-subtle">Credential ID</dt>
                          <dd className="mt-0.5 break-all text-fg-muted select-all">
                            {credential.credentialId}
                          </dd>
                        </div>
                      ) : null}
                    </dl>
                  ) : null}
                </div>

                {credential.verifyUrl ? (
                  <a
                    href={credential.verifyUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between gap-3 border-t border-line px-5 py-3 label text-fg-muted transition-colors hover:bg-raised hover:text-fg"
                  >
                    <span className="truncate">
                      Verify
                      <span className="text-fg-subtle">
                        {' '}
                        · {new URL(credential.verifyUrl).hostname}
                      </span>
                    </span>
                    <ArrowUpRight aria-hidden="true" className="size-3.5 shrink-0" />
                    <span className="sr-only">
                      {credential.code} credential (opens in a new tab)
                    </span>
                  </a>
                ) : null}
              </article>
            </li>
          )
        })}
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
