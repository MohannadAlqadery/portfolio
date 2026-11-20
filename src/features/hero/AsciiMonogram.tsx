import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { StatusDot } from '@/components/ui/StatusDot'
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion'
import { cn } from '@/lib/cn'
import {
  buildCells,
  buildGlyphs,
  Cell,
  createRandom,
  GRID_COLS,
  GRID_ROWS,
  NOISE,
  pick,
  toLayers,
} from './monogram'

// Monospace cells are ~0.6em wide; these make the grid fill a 4:5 card exactly.
// The grid is set at a normal 16px (so it never reads as illegible tiny text) and then scaled to
// the card's width. Monospace cells are ~0.6em wide; the line height fills a 4:5 card exactly.
const BASE_PX = 16
const GRID_W = GRID_COLS * 0.6 * BASE_PX
const LINE_HEIGHT = ((1.25 * GRID_COLS * 0.6) / GRID_ROWS).toFixed(3)

// Runs before paint in the browser (no flash at the wrong size); a plain effect on the server.
const useIsomorphicLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect

const LAYER_CLASS: Record<Cell, string> = {
  [Cell.Background]: 'text-fg-subtle/45',
  [Cell.Edge]: 'text-fg-muted/70',
  [Cell.Letter]: 'text-fg',
}

/**
 * "MA" rendered as ASCII art on a 4:5 card: the stand-in for a portrait. On first view the rows
 * decrypt from noise top to bottom; afterwards a few cells flicker now and then, like a live
 * feed. Reduced motion shows the settled card.
 */
export function AsciiMonogram({ className, seed = 7 }: { className?: string; seed?: number }) {
  const cells = useMemo(() => buildCells(), [])
  const settled = useMemo(() => buildGlyphs(cells, createRandom(seed)), [cells, seed])
  const reducedMotion = usePrefersReducedMotion()
  const cardRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(0)

  useIsomorphicLayoutEffect(() => {
    const card = cardRef.current
    if (!card) return
    const update = () => setScale(card.clientWidth / GRID_W)
    update()
    const observer = new ResizeObserver(update)
    observer.observe(card)
    return () => observer.disconnect()
  }, [])
  const [glyphs, setGlyphs] = useState(settled)

  useEffect(() => {
    if (reducedMotion) return
    const random = Math.random
    let frame = 0
    let flicker = 0
    let start: number | null = null
    // Each row settles at its own time: a scan from top to bottom with some jitter.
    const rowAt = settled.map((_, y) => 120 + (y / GRID_ROWS) * 900 + random() * 260)

    const decrypt = (now: number) => {
      start ??= now
      const elapsed = now - start
      let done = true
      setGlyphs(
        settled.map((row, y) => {
          if (elapsed >= (rowAt[y] ?? 0)) return row
          done = false
          return row.map((glyph, x) =>
            cells[y]?.[x] === Cell.Background && random() < 0.6 ? glyph : pick(NOISE, random),
          )
        }),
      )
      if (!done) frame = requestAnimationFrame(decrypt)
      else flicker = window.setInterval(flickerTick, 140)
    }

    // Afterwards: a handful of random cells show a noise glyph for one tick.
    const flickerTick = () => {
      if (document.hidden) return
      const next = settled.map((row) => row.slice())
      for (let i = 0; i < 5; i++) {
        const y = Math.floor(random() * GRID_ROWS)
        const x = Math.floor(random() * GRID_COLS)
        const row = next[y]
        if (row && cells[y]?.[x] !== Cell.Background) row[x] = pick(NOISE, random)
      }
      setGlyphs(next)
    }

    frame = requestAnimationFrame(decrypt)
    return () => {
      cancelAnimationFrame(frame)
      window.clearInterval(flicker)
    }
  }, [cells, settled, reducedMotion])

  // Reduced motion: always the settled card, whatever the animation state was.
  const layers = toLayers(cells, reducedMotion ? settled : glyphs)

  return (
    <div
      ref={cardRef}
      className={cn(
        '@container relative aspect-[4/5] overflow-hidden rounded-lg border border-line-strong bg-raised shadow-2xl shadow-black/40',
        className,
      )}
    >
      <span className="sr-only">The initials MA drawn in ASCII characters</span>
      <div
        aria-hidden="true"
        className="absolute top-0 left-0 origin-top-left"
        style={{ width: GRID_W, height: GRID_W * 1.25, transform: `scale(${scale})` }}
      >
        {([Cell.Background, Cell.Edge, Cell.Letter] as const).map((kind) => (
          <pre
            key={kind}
            className={cn(
              'absolute inset-0 m-0 overflow-hidden font-mono font-medium select-none',
              LAYER_CLASS[kind],
            )}
            style={{ fontSize: BASE_PX, lineHeight: LINE_HEIGHT }}
          >
            {layers[kind]}
          </pre>
        ))}
      </div>

      {/* A soft band sweeping down the card, like a scanner. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-1/4 animate-scan bg-linear-to-b from-transparent via-fg/[0.06] to-transparent motion-reduce:hidden"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 flex items-center justify-between p-[6cqw] label text-fg-subtle"
        style={{ fontSize: 'max(0.5rem, 3.4cqw)' }}
      >
        <span>ID · MA-01</span>
        <span className="flex items-center gap-1.5">
          <StatusDot pulse /> live
        </span>
      </div>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 flex items-center justify-between p-[6cqw] label text-fg-subtle"
        style={{ fontSize: 'max(0.5rem, 3.4cqw)' }}
      >
        <span>SOC · L1</span>
        <span>
          {GRID_COLS}×{GRID_ROWS}
        </span>
      </div>
    </div>
  )
}
