import { lazy, Suspense, useEffect, useRef, useState } from 'react'

const CityWatch = lazy(() => import('./CityWatch'))

/**
 * Downloads and starts the city only when the footer is near the viewport; until then (and on
 * pre-rendered pages) the band is just the page's background, which is also the city's sky, so nothing shifts when it draws.
 */
export function CityWatchLoader() {
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
          <CityWatch />
        </Suspense>
      ) : null}
    </div>
  )
}
