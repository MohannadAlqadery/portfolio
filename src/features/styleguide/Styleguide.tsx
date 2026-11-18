import type { ReactNode } from 'react'
import { ButtonLink, Button } from '@/components/ui/Button'
import { Chip, type ChipVariant } from '@/components/ui/Chip'
import { Container } from '@/components/ui/Container'
import { Kbd } from '@/components/ui/Kbd'
import { Panel } from '@/components/ui/Panel'
import { Rule } from '@/components/ui/Rule'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { StatusDot } from '@/components/ui/StatusDot'

const TOTAL = 4

const swatchGroups: { name: string; swatches: { token: string; hex: string }[] }[] = [
  {
    name: 'Neutrals',
    swatches: [
      { token: 'canvas', hex: '#0B0D0C' },
      { token: 'surface', hex: '#111412' },
      { token: 'raised', hex: '#161A17' },
      { token: 'line', hex: '#222724' },
      { token: 'line-strong', hex: '#2F3531' },
      { token: 'fg-subtle', hex: '#818981' },
      { token: 'fg-muted', hex: '#A3AAA2' },
      { token: 'fg', hex: '#EDEFEA' },
    ],
  },
  {
    name: 'Signal',
    swatches: [
      { token: 'signal-wash', hex: '#15241A' },
      { token: 'signal', hex: '#7BD389' },
      { token: 'signal-strong', hex: '#9BE3A6' },
    ],
  },
  {
    name: 'Severity',
    swatches: [
      { token: 'sev-critical', hex: '#E5534B' },
      { token: 'sev-high', hex: '#F0883E' },
      { token: 'sev-medium', hex: '#E8B14A' },
      { token: 'sev-low', hex: '#6CB6FF' },
      { token: 'sev-info', hex: '#A3AAA2' },
    ],
  },
]

const chipVariants: ChipVariant[] = [
  'neutral',
  'signal',
  'critical',
  'high',
  'medium',
  'low',
  'info',
]

function Specimen({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid gap-3 border-t border-line py-6 md:grid-cols-12 md:gap-8">
      <p className="label text-fg-subtle md:col-span-3">{label}</p>
      <div className="min-w-0 md:col-span-9">{children}</div>
    </div>
  )
}

export default function Styleguide() {
  return (
    <div className="pb-24">
      <Container as="header" className="flex items-center justify-between py-5">
        <p className="flex items-center gap-2 label text-fg-muted">
          <StatusDot pulse label="Live" />
          Styleguide · internal · v0.1
        </p>
        <ButtonLink href="#" variant="ghost" size="sm">
          ← Back to site
        </ButtonLink>
      </Container>

      <Container as="main" className="space-y-24 pt-10">
        <div className="space-y-6">
          <p className="label text-fg-subtle">N 24.45° · E 54.37° — Abu Dhabi</p>
          <h1 className="font-display text-display text-balance">
            Design <em className="text-fg-muted">reference</em>
          </h1>
          <p className="max-w-xl text-pretty text-fg-muted">
            Tokens and primitives for the portfolio. Dark-first, one signal accent, severity colours
            reserved for meaning. Everything here is built from the same pieces the site uses.
          </p>
        </div>

        <section aria-labelledby="sg-colour" className="space-y-2">
          <SectionHeader
            index={1}
            total={TOTAL}
            kicker="Colour"
            title="Palette"
            headingId="sg-colour"
          >
            Neutrals carry a faint green cast so the canvas never reads as flat grey.
          </SectionHeader>
          {swatchGroups.map((group) => (
            <Specimen key={group.name} label={group.name}>
              <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {group.swatches.map((s) => (
                  <li key={s.token} className="overflow-hidden rounded-md border border-line">
                    <div className="h-16" style={{ backgroundColor: `var(--color-${s.token})` }} />
                    <div className="space-y-0.5 bg-surface px-3 py-2">
                      <p className="font-mono text-xs text-fg">{s.token}</p>
                      <p className="label text-fg-subtle">{s.hex}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </Specimen>
          ))}
        </section>

        <section aria-labelledby="sg-type" className="space-y-2">
          <SectionHeader
            index={2}
            total={TOTAL}
            kicker="Type"
            title="Typography"
            headingId="sg-type"
          >
            Instrument Serif for editorial moments, Geist for reading, Geist Mono for data.
          </SectionHeader>
          <Specimen label="Display · serif">
            <p className="font-display text-display">Mohannad</p>
          </Specimen>
          <Specimen label="Headline · serif">
            <p className="font-display text-headline">
              Quiet work in <em>loud</em> networks
            </p>
          </Specimen>
          <Specimen label="Body · Geist">
            <p className="max-w-prose text-lg text-pretty text-fg-muted">
              I triage security alerts, separate true positives from noise, and follow suspicious
              activity across SIEM and endpoint telemetry until there is a clear answer.
            </p>
          </Specimen>
          <Specimen label="Mono · Geist Mono">
            <p className="font-mono text-sm text-fg-muted">
              SecurityAlert | where TimeGenerated &gt; ago(24h) | summarize count() by AlertSeverity
            </p>
          </Specimen>
          <Specimen label="Label · mono caps">
            <p className="label text-fg-subtle">CASE-2608 · REACH Digital · Abu Dhabi</p>
          </Specimen>
        </section>

        <section aria-labelledby="sg-components" className="space-y-2">
          <SectionHeader
            index={3}
            total={TOTAL}
            kicker="Components"
            title="Primitives"
            headingId="sg-components"
          />
          <Specimen label="Chips">
            <div className="flex flex-wrap gap-2">
              {chipVariants.map((v) => (
                <Chip key={v} variant={v} dot={v !== 'neutral'}>
                  {v}
                </Chip>
              ))}
            </div>
          </Specimen>
          <Specimen label="Status">
            <div className="flex flex-wrap items-center gap-6 text-sm text-fg-muted">
              <span className="flex items-center gap-2">
                <StatusDot pulse /> Active
              </span>
              <span className="flex items-center gap-2">
                <StatusDot tone="medium" /> Investigating
              </span>
              <span className="flex items-center gap-2">
                <StatusDot tone="critical" /> Escalated
              </span>
              <span className="flex items-center gap-2">
                <StatusDot tone="subtle" /> Closed
              </span>
            </div>
          </Specimen>
          <Specimen label="Buttons">
            <div className="flex flex-wrap items-center gap-3">
              <Button variant="primary">Open a channel</Button>
              <Button>View case files</Button>
              <Button variant="ghost">Skip</Button>
              <Button size="sm">Small</Button>
            </div>
          </Specimen>
          <Specimen label="Keys">
            <p className="flex items-center gap-1.5 text-sm text-fg-muted">
              <Kbd>Ctrl</Kbd>
              <Kbd>K</Kbd>
              <span className="ml-2">opens the command palette</span>
            </p>
          </Specimen>
          <Specimen label="Rules">
            <div className="space-y-6">
              <Rule />
              <Rule label="Evidence" />
            </div>
          </Specimen>
        </section>

        <section aria-labelledby="sg-composition" className="space-y-2">
          <SectionHeader
            index={4}
            total={TOTAL}
            kicker="Composition"
            title="Case file preview"
            headingId="sg-composition"
          >
            How the primitives combine. The real section arrives in Phase 5.
          </SectionHeader>
          <Specimen label="Panel">
            <Panel
              className="bg-dotgrid"
              title="CASE-2608 · SOC L1 Analyst"
              meta={
                <span className="flex items-center gap-2">
                  <StatusDot pulse /> active
                </span>
              }
            >
              <div className="flex flex-wrap gap-2">
                <Chip variant="signal" dot>
                  status:active
                </Chip>
                <Chip>REACH Digital LLC</Chip>
                <Chip>Abu Dhabi</Chip>
                <Chip>Aug 2026 → now</Chip>
              </div>
              <ul className="mt-5 space-y-2 text-fg-muted">
                <li>
                  Monitor and triage security alerts, separating true positives from false
                  positives.
                </li>
                <li>Investigate suspicious activity across SIEM and endpoint telemetry.</li>
                <li>
                  Document investigations in the case management system for audit and handover.
                </li>
              </ul>
            </Panel>
          </Specimen>
        </section>
      </Container>
    </div>
  )
}
