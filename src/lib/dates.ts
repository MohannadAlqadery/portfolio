const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function parse(ym: string): { year: number; month: number } {
  const [y, m] = ym.split('-').map(Number)
  if (!y || !m || m < 1 || m > 12) throw new Error(`Invalid YYYY-MM date: ${ym}`)
  return { year: y, month: m }
}

/** "2026-08" → "Aug 2026" */
export function formatMonth(ym: string): string {
  const { year, month } = parse(ym)
  return `${MONTHS[month - 1]} ${year}`
}

/** Inclusive month count between two `YYYY-MM` values (Jul–Aug = 2). */
export function monthsBetween(start: string, end: string): number {
  const a = parse(start)
  const b = parse(end)
  return (b.year - a.year) * 12 + (b.month - a.month) + 1
}

/** "4 mo", "1 yr", "1 yr 11 mo" */
export function formatDuration(months: number): string {
  const years = Math.floor(months / 12)
  const rest = months % 12
  const parts = []
  if (years) parts.push(`${years} yr`)
  if (rest) parts.push(`${rest} mo`)
  return parts.join(' ') || '1 mo'
}

/** `YYYY-MM` for a Date (local time). */
export function toYearMonth(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}
