import { useEffect, useLayoutEffect, useRef, useState, type ElementType } from 'react'
import { useInViewOnce } from '@/hooks/useInViewOnce'
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion'
import { cn } from '@/lib/cn'
import { DECRYPT_GLYPHS, randomGlyph, scramble } from '@/lib/decrypt'

// Runs before paint in the browser (no flash of the final text); a plain effect on the server.
const useIsomorphicLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect

type DecryptTextProps = {
  text: string
  as?: ElementType
  className?: string
  /** Total time until the last character settles, in ms. */
  duration?: number
  delay?: number
  /** Start on mount, or the first time the text scrolls into view. */
  trigger?: 'mount' | 'inView'
  glyphs?: string
}

/**
 * Text that "decrypts": characters cycle through random glyphs and lock in left to right with a
 * little jitter. The real text is always in the DOM for assistive tech and search engines, and an
 * invisible copy reserves its exact width so nothing around it shifts. Reduced motion shows the
 * final text straight away.
 */
export function DecryptText({
  text,
  as: Tag = 'span',
  className,
  duration = 1200,
  delay = 0,
  trigger = 'mount',
  glyphs = DECRYPT_GLYPHS,
}: DecryptTextProps) {
  const ref = useRef<HTMLElement>(null)
  const reducedMotion = usePrefersReducedMotion()
  const inView = useInViewOnce(ref, 0.6)
  const [shown, setShown] = useState(text)
  const doneFor = useRef<string | null>(null)

  const shouldRun = trigger === 'mount' || inView

  useIsomorphicLayoutEffect(() => {
    if (reducedMotion || doneFor.current === text) {
      setShown(text)
      return
    }
    // Hide the real text until the animation starts, so it never flashes in first.
    setShown(scramble(text, glyphs))
    if (!shouldRun) return

    // Each character settles at its own moment: mostly left to right, with some randomness.
    const settleAt = Array.from(text, (_, i) => {
      const progress = text.length > 1 ? i / (text.length - 1) : 1
      return delay + duration * (0.25 + 0.6 * progress + 0.15 * Math.random())
    })

    let frame = 0
    let start: number | null = null
    let lastSwap = -Infinity
    const tick = (now: number) => {
      start ??= now
      const elapsed = now - start
      // Swap glyphs every ~45ms rather than every frame: reads as flicker, not noise.
      if (elapsed - lastSwap >= 45) {
        lastSwap = elapsed
        let settled = 0
        const next = Array.from(text, (char, i) => {
          if (char.trim() === '' || elapsed >= (settleAt[i] ?? 0)) {
            settled++
            return char
          }
          return randomGlyph(glyphs)
        }).join('')
        setShown(next)
        if (settled === text.length) {
          doneFor.current = text
          return
        }
      }
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [text, duration, delay, glyphs, reducedMotion, shouldRun])

  return (
    <Tag ref={ref} className={cn('inline-grid', className)}>
      <span className="sr-only">{text}</span>
      {/* Reserves the final text's footprint; the animated copy sits on top in the same cell. */}
      <span aria-hidden="true" className="invisible [grid-area:1/1]">
        {text}
      </span>
      <span aria-hidden="true" data-decrypt className="[grid-area:1/1]">
        {shown}
      </span>
    </Tag>
  )
}
