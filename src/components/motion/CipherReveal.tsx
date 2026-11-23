import { useEffect, useRef, useState } from 'react'
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion'
import { cn } from '@/lib/cn'

/** Ciphertext look: hex digits and a few symbols, the way encrypted bytes are usually shown. */
const CIPHER = '0123456789abcdef#%&*+=/'
/** How often the ciphertext flickers (ms): slow enough to read as data, not noise. */
const FLICKER_MS = 70
/** Before the key sweep starts, and how long each character takes to ease into place (ms). */
const LEAD_MS = 220

const glyph = () => CIPHER[Math.floor(Math.random() * CIPHER.length)] ?? '0'

type CipherRevealProps = {
  text: string
  /** Total time until the last character has settled (ms). */
  duration?: number
  /** 0 → 1 as the key sweeps across; called on each flicker tick. */
  onProgress?: (progress: number) => void
  onDone?: () => void
  className?: string
}

/**
 * Decrypts `text` in place, like a real reveal: the characters start as dim, flickering
 * ciphertext, then a soft scan light sweeps left to right and each character it passes eases into
 * the real one (dim and slightly blurred → sharp). Every character sits in a slot exactly as wide
 * as its final letter, so the line never jumps or rewraps. The real text is in the DOM for screen
 * readers from the start, and Reduce Motion shows it straight away.
 */
export function CipherReveal({
  text,
  duration = 1300,
  onProgress,
  onDone,
  className,
}: CipherRevealProps) {
  const reduce = usePrefersReducedMotion()
  const chars = Array.from(text)
  const [cells, setCells] = useState(() =>
    chars.map((c) => ({ shown: c.trim() ? glyph() : c, settled: !c.trim() })),
  )
  const scanRef = useRef<HTMLSpanElement>(null)
  const callbacks = useRef({ onProgress, onDone })
  // Keep the latest callbacks without restarting the animation when the parent re-renders.
  useEffect(() => {
    callbacks.current = { onProgress, onDone }
  })

  useEffect(() => {
    if (reduce) {
      callbacks.current.onProgress?.(1)
      callbacks.current.onDone?.()
      return
    }
    const letters = Array.from(text)
    const sweep = Math.max(300, duration - LEAD_MS - 260)
    // Mostly left to right, with a little jitter so it doesn't look mechanical.
    const settleAt = letters.map((_, i) => {
      const along = letters.length > 1 ? i / (letters.length - 1) : 1
      return LEAD_MS + along * sweep + (Math.random() - 0.5) * 70
    })
    let frame = 0
    let start: number | null = null
    let lastFlicker = -Infinity
    let finished = false
    const finish = () => {
      if (finished) return
      finished = true
      cancelAnimationFrame(frame)
      setCells(letters.map((c) => ({ shown: c, settled: true })))
      callbacks.current.onProgress?.(1)
      callbacks.current.onDone?.()
    }
    const tick = (now: number) => {
      start ??= now
      const elapsed = now - start
      const progress = Math.min(1, Math.max(0, (elapsed - LEAD_MS) / sweep))
      // The scan light glides every frame; the glyphs only change on flicker ticks.
      const scan = scanRef.current
      if (scan) {
        scan.style.left = `${progress * 100}%`
        scan.style.opacity = String(progress <= 0 || progress >= 1 ? 0 : 1)
      }
      if (elapsed - lastFlicker >= FLICKER_MS) {
        lastFlicker = elapsed
        setCells(
          letters.map((c, i) =>
            !c.trim() || elapsed >= (settleAt[i] ?? 0)
              ? { shown: c, settled: true }
              : { shown: glyph(), settled: false },
          ),
        )
        callbacks.current.onProgress?.(progress)
      }
      if (elapsed >= duration) finish()
      else frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    // A safety net for background tabs (where frames pause) and environments without frames.
    const fallback = window.setTimeout(finish, duration + 400)
    return () => {
      cancelAnimationFrame(frame)
      window.clearTimeout(fallback)
    }
  }, [text, duration, reduce])

  return (
    <span className={cn('relative inline', className)}>
      <span className="sr-only">{text}</span>
      <span aria-hidden="true" data-decrypt>
        {chars.map((c, i) => {
          const cell = reduce ? { shown: c, settled: true } : cells[i]
          return (
            // The invisible real letter sets the slot's width; the visible glyph sits on top.
            <span key={i} className="relative inline-block">
              <span className="invisible">{c}</span>
              <span
                className={cn(
                  'absolute inset-0 text-center transition-[color,opacity,filter] duration-300 ease-out',
                  cell?.settled
                    ? 'text-fg opacity-100 blur-none'
                    : 'text-fg-subtle opacity-60 blur-[1.2px]',
                )}
              >
                {cell?.shown ?? c}
              </span>
            </span>
          )
        })}
      </span>
      {/* The key: a soft light that sweeps across as the characters resolve. */}
      <span
        ref={scanRef}
        aria-hidden="true"
        className="pointer-events-none absolute -inset-y-1 left-0 w-[2.5ch] -translate-x-1/2 bg-linear-to-r from-transparent via-fg/15 to-transparent opacity-0 transition-opacity duration-200"
      />
    </span>
  )
}
