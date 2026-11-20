import { useState, type ReactNode } from 'react'
import { BlurText } from '@/components/motion/BlurText'
import { DecryptText } from '@/components/motion/DecryptText'
import { ButtonLink, Button } from '@/components/ui/Button'
import { Chip, type ChipVariant } from '@/components/ui/Chip'
import { Container } from '@/components/ui/Container'
import { Kbd } from '@/components/ui/Kbd'
import { Panel } from '@/components/ui/Panel'
import { Rule } from '@/components/ui/Rule'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { StatusDot } from '@/components/ui/StatusDot'
import { useTheme } from '@/hooks/useTheme'

const TOTAL = 5

const swatchGroups: { name: string; swatches: { token: string; hex: string }[] }[] = [
  {
    name: 'Neutrals',
    swatches: [
      { token: 'canvas', hex: '#0A0A0A · #F4F4F2' },
      { token: 'surface', hex: '#111111 · #FFFFFF' },
      { token: 'raised', hex: '#171717 · #ECECEA' },
      { token: 'line', hex: '#232323 · #DCDCD8' },
      { token: 'line-strong', hex: '#2E2E2E · #C4C4BF' },
      { token: 'fg-subtle', hex: '#858585 · #646464' },
      { token: 'fg-muted', hex: '#A8A8A8 · #474747' },
      { token: 'fg', hex: '#F2F2F2 · #0A0A0A' },
    ],
  },
  {
    name: 'Signal',
    swatches: [
      { token: 'signal-wash', hex: '#15241A · #DCEFE0' },
      { token: 'signal', hex: '#7BD389 · #1F7A3A' },
      { token: 'signal-strong', hex: '#9BE3A6 · #17602D' },
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

function ThemeSwitch() {
  const { theme, toggle } = useTheme()
  return (
    <Button size="sm" onClick={toggle} aria-pressed={theme === 'light'}>
      Theme: {theme}
    </Button>
  )
}

/** Remounts its children on click, so entrance animations can be replayed. */
function Replay({ children }: { children: ReactNode }) {
  const [run, setRun] = useState(0)
  return (
    <div className="space-y-4">
      <div key={run}>{children}</div>
      <Button size="sm" variant="ghost" onClick={() => setRun((n) => n + 1)}>
        Replay
      </Button>
    </div>
  )
}

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
          Styleguide · internal · v2
        </p>
        <div className="flex items-center gap-2">
          <ThemeSwitch />
          <ButtonLink href="#" variant="ghost" size="sm">
            ← Back to site
          </ButtonLink>
        </div>
      </Container>

      <Container as="main" className="space-y-24 pt-10">
        <div className="space-y-6">
          <p className="label text-fg-subtle">N 24.45° · E 54.37° — Abu Dhabi</p>
          <h1 className="font-display text-display text-balance">
            Design <span className="text-fg-muted">reference</span>
          </h1>
          <p className="max-w-xl text-pretty text-fg-muted">
            Tokens and primitives for the portfolio. Monochrome, dark by default with a light theme,
            one signal accent, severity colours reserved for meaning. Everything here is built from
            the same pieces the site uses.
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
            True neutrals, dark · light. The accent only marks status and live states.
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
            Archivo for display (its width axis condenses and stretches), Geist for reading, Geist
            Mono for data.
          </SectionHeader>
          <Specimen label="Display · Archivo condensed">
            <p className="font-display text-display font-extrabold uppercase font-stretch-[72%]">
              Security analyst
            </p>
          </Specimen>
          <Specimen label="Display · Archivo widths">
            <div className="space-y-1 font-display text-5xl font-bold uppercase md:text-6xl">
              <p className="font-stretch-[62%]">Signal 62%</p>
              <p className="font-stretch-[100%]">Signal 100%</p>
              <p className="font-stretch-[125%]">Signal 125%</p>
            </div>
          </Specimen>
          <Specimen label="Headline · Archivo">
            <p className="font-display text-headline font-semibold">Quiet work in loud networks</p>
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

        <section aria-labelledby="sg-motion" className="space-y-2">
          <SectionHeader
            index={4}
            total={TOTAL}
            kicker="Motion"
            title="Text effects"
            headingId="sg-motion"
          >
            Entrance effects for headlines and labels. With Reduce Motion on, the final text shows
            at once.
          </SectionHeader>
          <Specimen label="Decrypt · display">
            <Replay>
              <DecryptText
                as="p"
                text="[ SECURITY ANALYST ]"
                duration={1400}
                className="font-display text-headline font-extrabold uppercase font-stretch-[75%]"
              />
            </Replay>
          </Specimen>
          <Specimen label="Decrypt · label">
            <Replay>
              <DecryptText
                as="p"
                text="{{ /SOC & INCIDENT RESPONSE }}"
                duration={1000}
                className="font-mono text-sm text-fg-muted"
              />
            </Replay>
          </Specimen>
          <Specimen label="Blur in · words">
            <Replay>
              <BlurText
                as="p"
                trigger="mount"
                text="Hi, I’m Mohannad."
                className="font-display text-headline font-bold"
              />
            </Replay>
          </Specimen>
          <Specimen label="Blur in · letters">
            <Replay>
              <BlurText
                as="p"
                by="letter"
                trigger="mount"
                text="Open a channel."
                className="font-display text-headline font-bold"
              />
            </Replay>
          </Specimen>
        </section>

        <section aria-labelledby="sg-composition" className="space-y-2">
          <SectionHeader
            index={5}
            total={TOTAL}
            kicker="Composition"
            title="Case file preview"
            headingId="sg-composition"
          >
            How the primitives combine. The case-file folders arrive in v2.5.
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
