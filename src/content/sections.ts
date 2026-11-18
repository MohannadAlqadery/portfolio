/** Indexed page sections, in display order. Drives the nav, the command palette and headers. */
export const sections = [
  { id: 'profile', label: 'Profile' },
  { id: 'cases', label: 'Case files' },
  { id: 'credentials', label: 'Credentials' },
  { id: 'toolkit', label: 'Toolkit' },
  { id: 'education', label: 'Education' },
  { id: 'contact', label: 'Contact' },
] as const

export type SectionId = (typeof sections)[number]['id']

export const sectionCount = sections.length

/** 1-based position of a section, used for the `01 / 06` index. */
export function sectionIndex(id: SectionId): number {
  return sections.findIndex((s) => s.id === id) + 1
}
