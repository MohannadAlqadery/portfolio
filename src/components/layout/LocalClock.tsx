import { site } from '@/content/site'
import { useHydratedNow } from '@/hooks/useNow'
import { cn } from '@/lib/cn'
import { formatClock } from '@/lib/time'

/** "ABU DHABI 14:05 GST", the owner's local time. Shows "--:--" until the client knows the time. */
export function LocalClock({ className }: { className?: string }) {
  const now = useHydratedNow()

  return (
    <p className={cn('label whitespace-nowrap text-fg-subtle', className)}>
      {site.location.city}{' '}
      <time dateTime={now?.toISOString()} className="text-fg-muted tabular-nums">
        {now ? formatClock(now, site.location.timeZone) : '--:--'}
      </time>{' '}
      {site.location.timeZoneLabel}
    </p>
  )
}
