import { StatusDot } from '@/components/ui/StatusDot'
import { credentials } from '@/content/credentials'
import { site } from '@/content/site'

/**
 * 1200×630 social preview card, rendered at /#og and captured to public/og.png by
 * `npm run og`. Uses the real fonts and tokens so it always matches the site.
 */
export default function OgCard() {
  const [firstName, ...rest] = site.name.split(' ')
  const certs = credentials
    .filter((c) => c.featured)
    .map((c) => c.code)
    .join(' · ')

  return (
    <div
      id="og-card"
      className="relative flex h-[630px] w-[1200px] flex-col justify-between overflow-hidden bg-canvas p-16"
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-dotgrid [mask-image:radial-gradient(ellipse_60%_70%_at_85%_60%,black,transparent_75%)] opacity-70"
      />

      <div className="relative flex items-center justify-between">
        <p className="label text-[15px] text-fg-subtle">
          {site.location.coordinates} / {site.location.city}, {site.location.country}
        </p>
        <p className="flex items-center gap-2 label text-[15px] text-fg-muted">
          <StatusDot /> On shift
        </p>
      </div>

      <div className="relative">
        <p className="font-display text-[132px] leading-[0.9] tracking-[-0.025em] text-fg">
          {firstName} <em className="text-fg-muted">{rest.join(' ')}</em>
        </p>
        <p className="mt-8 max-w-[900px] text-[30px] leading-snug text-fg-muted">
          SOC Analyst. Alert triage, investigation and incident response.
        </p>
      </div>

      <div className="relative flex items-end justify-between">
        <div className="flex items-center gap-4">
          <span className="grid size-12 place-items-center rounded-md border border-line-strong font-mono text-[15px] text-fg">
            {site.monogram}
          </span>
          <span className="font-mono text-[17px] text-fg-subtle">
            <span className="text-signal">|</span> where Name has{' '}
            <span className="text-sev-medium">"Alqadery"</span>
          </span>
        </div>
        <p className="font-mono text-[17px] tracking-wide text-fg-muted">{certs}</p>
      </div>
    </div>
  )
}
