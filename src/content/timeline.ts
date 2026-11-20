import { cases } from '@/content/cases'
import { credentials } from '@/content/credentials'
import { education } from '@/content/education'
import { formatMonth } from '@/lib/dates'

/**
 * The "signal trace": roles, study and certifications on one line, newest first. Every entry is
 * derived from the other content files, so dates and names never drift apart.
 */
export type TimelineKind = 'role' | 'study' | 'certification'

export type TimelineEntry = {
  id: string
  kind: TimelineKind
  /** `YYYY-MM` used for ordering (the moment the entry happened or started). */
  at: string
  when: string
  title: string
  org: string
  detail: string
  current?: boolean
}

const range = (start: string, end: string | null) =>
  `${formatMonth(start)} → ${end ? formatMonth(end) : 'now'}`

const roles: TimelineEntry[] = cases.map((file) => ({
  id: file.id,
  kind: 'role',
  at: file.start,
  when: range(file.start, file.end),
  title: file.shortTitle ?? file.title,
  org: file.org.replace(/ LLC$/, ''),
  detail: file.summary,
  current: file.status === 'active',
}))

// The featured certifications were all earned within a few months: one node for the set.
const featured = credentials.filter((c) => c.featured && c.issued)
const issuedMonths = featured.map((c) => (c.issued ?? '').slice(0, 7)).sort()
const certifications: TimelineEntry[] =
  featured.length > 0
    ? [
        {
          id: 'certifications',
          kind: 'certification',
          // Placed at the first one, so the set sits right after the role it led to.
          at: issuedMonths[0] ?? '',
          when:
            issuedMonths[0] === issuedMonths.at(-1)
              ? formatMonth(issuedMonths[0] ?? '')
              : `${formatMonth(issuedMonths[0] ?? '')} → ${formatMonth(issuedMonths.at(-1) ?? '')}`,
          title: featured.map((c) => c.code).join(' · '),
          org: [...new Set(featured.map((c) => c.issuer))].join(' · '),
          detail:
            'Certified on the SOC side and the offensive side within one summer: detection and response, plus the attacker’s view.',
        },
      ]
    : []

const study: TimelineEntry[] = [
  {
    id: 'graduated',
    kind: 'study',
    at: education.end,
    when: formatMonth(education.end),
    title: 'Graduated, B.Sc.',
    org: education.school,
    detail: `Cybersecurity and Cloud Computing · ${education.result}.`,
  },
  {
    id: 'enrolled',
    kind: 'study',
    at: education.start,
    when: formatMonth(education.start),
    title: 'Started the B.Sc.',
    org: education.school,
    detail:
      'Where the security work began: networks, labs and the first logs, then forensics, cloud and offensive courses.',
  },
]

export const timeline: TimelineEntry[] = [...roles, ...certifications, ...study].sort((a, b) =>
  // Newest first; within the same month: certification, then role, then study.
  a.at === b.at ? a.kind.localeCompare(b.kind) : b.at.localeCompare(a.at),
)

export const KIND_LABEL: Record<TimelineKind, string> = {
  role: 'Role',
  study: 'Study',
  certification: 'Certification',
}
