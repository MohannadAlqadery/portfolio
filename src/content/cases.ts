/** Experience, written up as case files. Dates are `YYYY-MM`; `end: null` means ongoing. */
export type CaseFile = {
  id: string
  status: 'active' | 'closed'
  classification: string
  title: string
  org: string
  location: string
  start: string
  end: string | null
  summary: string
  actions: string[]
  note?: string
  tags: string[]
}

export const cases: CaseFile[] = [
  {
    id: 'CASE-2608',
    status: 'active',
    classification: 'Security operations',
    title: 'SOC L1 Analyst',
    org: 'REACH Digital LLC',
    location: 'Abu Dhabi, UAE',
    start: '2026-08',
    end: null,
    summary: 'First line of the SOC: triage, investigation and clean escalation.',
    actions: [
      'Monitor and triage security alerts, separating true positives from false positives and classifying incidents by severity.',
      'Investigate suspicious activity across SIEM and endpoint telemetry, and escalate confirmed incidents to L2 following defined playbooks.',
      'Document investigations and actions taken in the case management system for audit and handover.',
    ],
    tags: ['Alert triage', 'SIEM', 'EDR', 'Playbooks', 'Escalation', 'Case documentation'],
  },
  {
    id: 'CASE-2507',
    status: 'closed',
    classification: 'Internship',
    title: 'Cybersecurity Intern',
    org: 'REACH Digital LLC',
    location: 'Abu Dhabi, UAE',
    start: '2025-07',
    end: '2025-08',
    summary: 'Hands-on security work inside a live enterprise environment.',
    actions: [
      'Completed hands-on network and information security labs inside a live enterprise environment.',
      'Reviewed security logs to spot suspicious activity and followed how alerts move through incident response.',
      'Practised vulnerability assessment and security testing on guided lab targets, then wrote up the findings.',
    ],
    tags: ['Log review', 'Incident response', 'Vulnerability assessment', 'Write-ups'],
  },
  {
    id: 'CASE-2408',
    status: 'closed',
    classification: 'Compliance',
    title: 'Quality Assurance and Compliance Representative',
    org: 'WUDUH',
    location: 'Amman, Jordan',
    start: '2024-08',
    end: '2026-06',
    summary: 'Policy and regulatory review of sensitive client records.',
    actions: [
      'Reviewed client files against company policy, program rules and national regulations, and blocked non-compliant records from moving forward.',
      'Handled sensitive personal data daily under set confidentiality and data handling procedures.',
      'Ran quality checks on submitted documents, flagged discrepancies and escalated non-compliant cases.',
    ],
    note: 'Promoted into the quality assurance role after four months in a client-facing position.',
    tags: ['Compliance', 'Sensitive data', 'Quality checks', 'Escalation'],
  },
]
