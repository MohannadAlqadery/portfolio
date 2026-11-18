const formatters = new Map<string, Intl.DateTimeFormat>()

/** 24-hour `HH:mm` for the given IANA time zone. Formatters are cached per zone. */
export function formatClock(date: Date, timeZone: string): string {
  let formatter = formatters.get(timeZone)
  if (!formatter) {
    formatter = new Intl.DateTimeFormat('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
      timeZone,
    })
    formatters.set(timeZone, formatter)
  }
  return formatter.format(date)
}
