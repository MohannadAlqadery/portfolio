import { lazy, Suspense, useEffect, useRef, useState } from 'react'

const TrafficCrowd = lazy(() => import('./TrafficCrowd'))

/**
 * Downloads and starts the crowd only when the footer is near the viewport; until then (and on
 * pre-rendered pages) the band is just its background, so nothing shifts when people arrive.
 */
export function TrafficCrowdLoader() {
  const ref = useRef<HTMLDivElement>(null)
  const [near, setNear] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setNear(true)
          observer.disconnect()
        }
      },
      { rootMargin: '800px 0px' },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <div ref={ref} className="absolute inset-0">
      {near ? (
        <Suspense fallback={null}>
          <TrafficCrowd />
        </Suspense>
      ) : null}
    </div>
  )
}
