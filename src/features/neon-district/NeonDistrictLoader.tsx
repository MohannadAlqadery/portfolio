import { lazy, Suspense, useEffect, useRef, useState } from 'react'

const NeonDistrict = lazy(() => import('./NeonDistrict'))

/**
 * Downloads and starts the street only when the footer is near the viewport; until then (and on
 * pre-rendered pages) the band is just its sky colour, so nothing shifts when the city lights up.
 */
export function NeonDistrictLoader() {
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
          <NeonDistrict />
        </Suspense>
      ) : null}
    </div>
  )
}
