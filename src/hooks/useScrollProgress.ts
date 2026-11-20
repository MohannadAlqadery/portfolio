import { useMotionValue, type MotionValue } from 'motion/react'
import { useEffect, type RefObject } from 'react'

/**
 * Scroll progress (0 → 1) of an element through the viewport, as a motion value.
 *
 * `start` / `end` are viewport fractions, like motion's `offset: ['start <start>', 'end <end>']`:
 * progress is 0 when the element's top reaches `start × viewport height` and 1 when its bottom
 * reaches `end × viewport height`.
 *
 * We measure this ourselves instead of using motion's `useScroll` because a dialog's scroll lock
 * (the Ctrl K palette) restyles <body>, and `useScroll` re-measured during the lock and jumped the
 * hero to its end state. Here, nothing updates while the page is locked, so whatever is driven by
 * scroll stays exactly where it was until the dialog closes.
 */
export function useScrollProgress(
  ref: RefObject<HTMLElement | null>,
  { start = 1, end = 0 }: { start?: number; end?: number } = {},
): MotionValue<number> {
  const progress = useMotionValue(0)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const update = () => {
      if (document.body.hasAttribute('data-scroll-locked')) return
      const rect = el.getBoundingClientRect()
      const vh = window.innerHeight
      const span = rect.height + vh * start - vh * end
      const value = span > 0 ? (vh * start - rect.top) / span : 0
      progress.set(Math.min(1, Math.max(0, value)))
    }
    update()
    window.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => {
      window.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
      ro.disconnect()
    }
  }, [ref, start, end, progress])

  return progress
}
