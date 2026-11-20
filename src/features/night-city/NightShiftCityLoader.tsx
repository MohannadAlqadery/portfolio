import { lazy, Suspense, useEffect, useRef, useState } from 'react'

const NightShiftCity = lazy(() => import('./NightShiftCity'))

/**
 * Reserves the city's space in the footer (so nothing shifts when it appears) and only downloads
 * and starts it when the footer is close to the viewport. Pre-rendered pages get the empty
 * placeholder; the city itself is client-only.
 */
export function NightShiftCityLoader({ className }: { className?: string }) {
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
      { rootMargin: '600px 0px' },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <div ref={ref} className={className}>
      {near ? (
        <Suspense fallback={null}>
          <NightShiftCity />
        </Suspense>
      ) : null}
    </div>
  )
}
