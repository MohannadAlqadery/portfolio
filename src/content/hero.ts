import type { QueryLine } from '@/features/hero/kql'

export const hero = {
  status: 'On shift · SOC L1 at REACH Digital',
  intro:
    'I work the first line of a security operations centre: triaging alerts, separating signal from noise, and following suspicious activity across SIEM and endpoint telemetry until there is a clear answer.',
} as const

/** Copy for the v2 hero scene and the intro it turns into. Facts only, from the resume. */
export const heroScene = {
  /** Two display lines, framed by brackets. */
  headline: ['Security', 'Analyst'],
  tagline: '{{ /SOC & INCIDENT RESPONSE }}',
  greeting: ['Hi, I’m', 'Mohannad.'],
  role: ['SOC analyst', 'on the blue team.'],
  current: { label: 'Currently at', org: 'REACH Digital', title: 'SOC L1 Analyst' },
  /** Bold parts are the nouns a reader should catch when skimming. */
  statement: [
    { text: 'I triage ' },
    { text: 'security alerts', strong: true },
    { text: ' and follow ' },
    { text: 'suspicious activity', strong: true },
    { text: ' across SIEM and endpoint telemetry until there is a ' },
    { text: 'clear answer', strong: true },
    { text: '.' },
  ],
  cta: 'Read the case files',
} as const

/** The query typed in the hero console. Pre-tokenised so highlighting needs no parser. */
export const heroQuery: QueryLine[] = [
  [{ kind: 'table', text: 'SecurityAnalysts' }],
  [
    { kind: 'pipe', text: '| ' },
    { kind: 'keyword', text: 'where' },
    { kind: 'plain', text: ' ' },
    { kind: 'field', text: 'Name' },
    { kind: 'plain', text: ' ' },
    { kind: 'operator', text: '==' },
    { kind: 'plain', text: ' ' },
    { kind: 'string', text: '"Mohannad"' },
  ],
  [
    { kind: 'pipe', text: '| ' },
    { kind: 'keyword', text: 'where' },
    { kind: 'plain', text: ' ' },
    { kind: 'field', text: 'Base' },
    { kind: 'plain', text: ' ' },
    { kind: 'operator', text: '==' },
    { kind: 'plain', text: ' ' },
    { kind: 'string', text: '"Abu Dhabi"' },
  ],
  [
    { kind: 'pipe', text: '| ' },
    { kind: 'keyword', text: 'project' },
    { kind: 'plain', text: ' ' },
    { kind: 'field', text: 'Role' },
    { kind: 'plain', text: ', ' },
    { kind: 'field', text: 'Focus' },
    { kind: 'plain', text: ', ' },
    { kind: 'field', text: 'Certs' },
    { kind: 'plain', text: ', ' },
    { kind: 'field', text: 'Stack' },
  ],
]

/** The single "record" the query returns. Every value comes straight from the resume. */
export const heroResult: { field: string; value: string }[] = [
  { field: 'Role', value: 'SOC L1 Analyst · REACH Digital' },
  { field: 'Focus', value: 'Alert triage · Investigation · Incident response' },
  { field: 'Certs', value: 'SC-200 · eJPTv2 · eSOC' },
  { field: 'Stack', value: 'Sentinel · Defender XDR · Splunk · KQL' },
]
