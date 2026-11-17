import type { QueryLine } from '@/features/hero/kql'

export const hero = {
  status: 'On shift · SOC L1 at Reach Digital',
  intro:
    'I work the first line of a security operations centre: triaging alerts, separating signal from noise, and following suspicious activity across SIEM and endpoint telemetry until there is a clear answer.',
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
  { field: 'Role', value: 'SOC L1 Analyst · Reach Digital' },
  { field: 'Focus', value: 'Alert triage · Investigation · Incident response' },
  { field: 'Certs', value: 'SC-200 · eJPTv2 · eSOC' },
  { field: 'Stack', value: 'Sentinel · Defender XDR · Splunk · KQL' },
]
