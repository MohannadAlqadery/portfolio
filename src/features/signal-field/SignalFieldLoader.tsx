import { lazy, Suspense, useEffect, useRef, useState } from 'react'

const SignalField = lazy(() => import('./SignalField'))

/** Downloads and starts the field only when the footer is near; until then it's empty space. */
export function SignalFieldLoader() {
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
          <SignalField />
        </Suspense>
      ) : null}
    </div>
  )
}
