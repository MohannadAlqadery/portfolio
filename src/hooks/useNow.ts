import { useEffect, useState } from 'react'

/** Current time, refreshed on each minute boundary (enough for an HH:mm clock). */
export function useNow(): Date {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    let interval: number | undefined
    const msToNextMinute = 60_000 - (Date.now() % 60_000)

    const timeout = window.setTimeout(() => {
      setNow(new Date())
      interval = window.setInterval(() => setNow(new Date()), 60_000)
    }, msToNextMinute)

    return () => {
      window.clearTimeout(timeout)
      if (interval !== undefined) window.clearInterval(interval)
    }
  }, [])

  return now
}
