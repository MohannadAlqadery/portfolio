import type { Note } from './notes'

export const SITE_TITLE = 'Mohannad Alqadery — SOC Analyst, Abu Dhabi'
export const NOTES_TITLE = 'Field notes — Mohannad Alqadery'
export const NOTES_DESCRIPTION =
  'Study notes, detection queries and methodology from SOC work and certification prep: SC-200, eJPT and eSOC.'
export const NOT_FOUND_TITLE = 'Not found — Mohannad Alqadery'

export const noteTitle = (note: Pick<Note, 'title'>) => `${note.title} — Mohannad Alqadery`

/** "2026-11-18" → "18 Nov 2026" */
export function formatDay(date: string): string {
  const months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ]
  return `${Number(date.slice(8, 10))} ${months[Number(date.slice(5, 7)) - 1]} ${date.slice(0, 4)}`
}
