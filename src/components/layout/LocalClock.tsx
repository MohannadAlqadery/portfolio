import { site } from '@/content/site'
import { useNow } from '@/hooks/useNow'
import { cn } from '@/lib/cn'
import { formatClock } from '@/lib/time'

/** "ABU DHABI 14:05 GST", the owner's local time. */
export function LocalClock({ className }: { className?: string }) {
  const now = useNow()
  const time = formatClock(now, site.location.timeZone)

  return (
    <p className={cn('label whitespace-nowrap text-fg-subtle', className)}>
      {site.location.city}{' '}
      <time dateTime={now.toISOString()} className="text-fg-muted tabular-nums">
        {time}
      </time>{' '}
      {site.location.timeZoneLabel}
    </p>
  )
}
