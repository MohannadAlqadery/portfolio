import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion'
import { cn } from '@/lib/cn'
import { buildCrowd, nextDetection, type Detection } from './crowd'

// The figures are static, optimised SVG files (see peeps/README.md), loaded as plain images.
const peeps = Object.values(
  import.meta.glob<string>('./peeps/*.svg', { eager: true, query: '?url', import: 'default' }),
)

const WALKERS = 24
/** At most this many boxes at once (fewer on phones, where figures are wider). */
const maxDetections = () => (window.innerWidth < 640 ? 2 : 3)
/** Boxes keep at least this much distance between figure centres (px), so tags don't stack. */
const MIN_GAP = 140
const ROW = [
  // back, middle, front. Every figure runs past the band's bottom edge (the drawings are cropped
  // at the chest), and heads sit higher toward the back.
  { height: 'h-[90%]', bottom: '-8%', z: 1 },
  { height: 'h-[86%]', bottom: '-14%', z: 2 },
  { height: 'h-[82%]', bottom: '-22%', z: 3 },
] as const

const TAG_CLASS: Record<Detection['kind'], string> = {
  benign: 'bg-[#111] text-white',
  user: 'bg-[#111] text-white',
  anomaly: 'bg-[#b0530c] text-white',
}

/** Corner brackets around a walker, like a detection box in a video feed. */
function DetectionBox({ detection }: { detection: Detection }) {
  const anomaly = detection.kind === 'anomaly' && !detection.triaged
  const color = anomaly ? 'border-[#b0530c]' : 'border-[#111]'
  const corner = cn('absolute size-3', color)
  return (
    <span
      data-detection={detection.kind}
      className="pointer-events-none absolute inset-x-[14%] top-[2%] bottom-[40%] animate-[detect-in_220ms_ease-out_both]"
    >
      <span className={cn(corner, 'top-0 left-0 border-t-2 border-l-2')} />
      <span className={cn(corner, 'top-0 right-0 border-t-2 border-r-2')} />
      <span className={cn(corner, 'bottom-0 left-0 border-b-2 border-l-2')} />
      <span className={cn(corner, 'right-0 bottom-0 border-r-2 border-b-2')} />
      <span
        className={cn(
          'absolute -top-6 left-0 font-mono text-[0.625rem] leading-none whitespace-nowrap uppercase',
          'rounded-[2px] px-1.5 py-1 tracking-wider',
          detection.triaged ? 'bg-[#1f7a3a] text-white' : TAG_CLASS[detection.kind],
        )}
      >
        {detection.triaged ? 'triaged · benign' : detection.label}
      </span>
    </span>
  )
}

/**
 * The footer's "traffic": a crowd of line-drawn people walking across a white band, with
 * detection boxes locking onto passers-by and the odd anomaly being triaged. Pauses when off
 * screen; with Reduce Motion the crowd stands still and one box stays on.
 */
export default function TrafficCrowd() {
  const ref = useRef<HTMLDivElement>(null)
  const reducedMotion = usePrefersReducedMotion()
  const walkers = useMemo(() => buildCrowd(WALKERS, peeps.length), [])
  const [visible, setVisible] = useState(false)
  const [detections, setDetections] = useState<Detection[]>([])
  const [triagedCount, setTriagedCount] = useState(0)

  // Only animate while the band is on screen.
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(([entry]) => setVisible(!!entry?.isIntersecting))
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  // Detections: a new box every ~1.4s (at most three at once), each for ~2.8s; anomalies are
  // triaged halfway through. Only front and middle rows, where the figures are big enough.
  useEffect(() => {
    if (reducedMotion || !visible) return
    const random = Math.random
    const band = ref.current
    const centreOf = (el: Element) => {
      const r = el.getBoundingClientRect()
      return r.left + r.width / 2
    }
    // Front two rows only, fully inside the band, and clear of figures that already have a box.
    const candidates = () => {
      if (!band) return []
      const bounds = band.getBoundingClientRect()
      const busy = [...band.querySelectorAll('[data-walker]:has([data-detection])')].map(centreOf)
      return [...band.querySelectorAll<HTMLElement>('[data-walker]')]
        .filter((el) => {
          if (el.dataset.row === '0') return false
          const r = el.getBoundingClientRect()
          const inside = r.width > 0 && r.left > bounds.left + 24 && r.right < bounds.right - 24
          return inside && busy.every((x) => Math.abs(x - centreOf(el)) > MIN_GAP)
        })
        .map((el) => Number(el.dataset.walker))
    }
    let key = 0
    const timers = new Set<number>()
    const later = (fn: () => void, ms: number) => {
      const t = window.setTimeout(() => {
        timers.delete(t)
        fn()
      }, ms)
      timers.add(t)
    }
    const spawn = () => {
      const pool = candidates()
      if (pool.length === 0) return
      const detection = nextDetection(key++, pool, random)
      setDetections((current) =>
        current.length >= maxDetections() || current.some((d) => d.walker === detection.walker)
          ? current
          : [...current, detection],
      )
      if (detection.kind === 'anomaly') {
        later(() => {
          setDetections((current) =>
            current.map((d) => (d.key === detection.key ? { ...d, triaged: true } : d)),
          )
          setTriagedCount((n) => n + 1)
        }, 1400)
      }
      later(() => setDetections((current) => current.filter((d) => d.key !== detection.key)), 2800)
    }
    spawn()
    const interval = window.setInterval(spawn, 1400)
    return () => {
      window.clearInterval(interval)
      timers.forEach((t) => window.clearTimeout(t))
    }
  }, [reducedMotion, visible])

  // Reduced motion: one steady box on a front-row figure.
  const shown: Detection[] = reducedMotion
    ? [{ key: -1, walker: 2, kind: 'user', label: 'verified user', triaged: false }]
    : detections

  return (
    <div
      ref={ref}
      data-crowd
      data-paused={!visible || reducedMotion}
      className="group/crowd absolute inset-0 overflow-hidden"
    >
      {walkers.map((w) => {
        const row = ROW[w.row]
        const detection = shown.find((d) => d.walker === w.id)
        const lane: CSSProperties = reducedMotion
          ? { transform: `translateX(${(w.rest * 112 - 8).toFixed(1)}%)` }
          : {
              animationDuration: `${w.duration}s`,
              animationDelay: `${w.delay}s`,
              animationDirection: w.reverse ? 'reverse' : 'normal',
            }
        return (
          // Full-width lane that slides across the band; the figure sits at its left edge.
          <div
            key={w.id}
            className={cn(
              'pointer-events-none absolute inset-x-0 h-full [--walk-from:-55%] sm:[--walk-from:-22%]',
              !reducedMotion &&
                'animate-[crowd-walk_linear_infinite] group-data-[paused=true]/crowd:[animation-play-state:paused]',
              w.wideOnly && 'max-sm:hidden',
            )}
            style={{ ...lane, bottom: row.bottom, zIndex: row.z }}
          >
            <div
              data-walker={w.id}
              data-row={w.row}
              className={cn(
                'absolute bottom-0 left-0 aspect-[850/1200]',
                row.height,
                !reducedMotion &&
                  'animate-[crowd-step_ease-in-out_infinite_alternate] group-data-[paused=true]/crowd:[animation-play-state:paused]',
              )}
              style={reducedMotion ? undefined : { animationDuration: `${w.step}s` }}
            >
              <img
                src={peeps[w.peep]}
                alt=""
                draggable={false}
                decoding="async"
                className={cn('size-full select-none', w.reverse && '-scale-x-100')}
              />
              {detection ? <DetectionBox detection={detection} /> : null}
            </div>
          </div>
        )
      })}

      <p
        aria-hidden="true"
        className="absolute top-3 right-4 z-10 font-mono text-[0.625rem] tracking-wider text-[#555] uppercase max-sm:hidden md:right-6"
      >
        {walkers.length} sessions · triaged {triagedCount}
      </p>
    </div>
  )
}
