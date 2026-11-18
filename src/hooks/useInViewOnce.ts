import { useEffect, useState, type RefObject } from 'react'

/**
 * Becomes `true` the first time the element is at least `threshold` visible, then stays true.
 * Treated as visible immediately where IntersectionObserver is unavailable.
 */
export function useInViewOnce(ref: RefObject<Element | null>, threshold = 0.35): boolean {
  const [inView, setInView] = useState(() => typeof IntersectionObserver === 'undefined')

  useEffect(() => {
    const element = ref.current
    if (inView || !element) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setInView(true)
          observer.disconnect()
        }
      },
      { threshold },
    )
    observer.observe(element)
    return () => observer.disconnect()
  }, [ref, threshold, inView])

  return inView
}
