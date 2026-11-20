import { useEffect, useRef, useState } from 'react'
import { DECRYPT_GLYPHS } from '@/lib/decrypt'
import { createRandom } from '@/lib/random'
import { subscribeTheme } from '@/lib/theme'
import { cellSizeFor, decay, falloff, spawnPacket, stepPackets, sweepX, type Packet } from './field'

const WORD = 'MOHANNAD.'
const PACKETS = 16
const LENS = 90 // px radius of the cursor "scanner lens"
const HEX = '0123456789ABCDEF'

type Grid = {
  cell: number
  cols: number
  rows: number
  /** Cell indices that belong to the wordmark. */
  letters: number[]
  isLetter: Uint8Array
  /** Pre-rendered dim base (grid + wordmark) at device resolution. */
  base: HTMLCanvasElement
}

function readColors() {
  const style = getComputedStyle(document.documentElement)
  return {
    fg: style.getPropertyValue('--color-fg').trim() || '#f2f2f2',
    subtle: style.getPropertyValue('--color-fg-subtle').trim() || '#858585',
  }
}

/** Rasterise the wordmark into the cell grid, then pre-render the dim base layer. */
function buildGrid(
  width: number,
  height: number,
  dpr: number,
  colors: { fg: string; subtle: string },
): Grid {
  const cell = cellSizeFor(width)
  const cols = Math.floor(width / cell)
  const rows = Math.floor(height / cell)

  const mask = document.createElement('canvas')
  mask.width = cols
  mask.height = rows
  const m = mask.getContext('2d', { willReadFrequently: true })
  const isLetter = new Uint8Array(cols * rows)
  const letters: number[] = []
  if (m) {
    // Condensed Archivo, sized so the word fills ~94% of the width and ~80% of the height.
    // Condensed Archivo, sized so the word fills ~96% of the width (and at most ~90% of the
    // height). Setting `font` resets `fontStretch`, so both are always set together.
    const setFont = (px: number) => {
      m.font = `800 ${px}px "Archivo Variable", "Archivo Fallback", sans-serif`
      if ('fontStretch' in m) {
        ;(m as CanvasRenderingContext2D & { fontStretch: string }).fontStretch = 'condensed'
      }
    }
    let size = rows * 0.9
    setFont(size)
    size = Math.min(size, size * ((cols * 0.96) / m.measureText(WORD).width))
    setFont(size)
    m.textAlign = 'center'
    m.textBaseline = 'alphabetic'
    m.fillStyle = '#000'
    // Stretch the lettering vertically so its ink fills ~78% of the field: a tall, condensed
    // wordmark at any width (canvas support for font-stretch is patchy, so we don't rely on it).
    const metrics = m.measureText(WORD)
    const ink = metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent || size * 0.72
    const stretch = Math.min(2.2, Math.max(1, (rows * 0.78) / ink))
    m.save()
    m.translate(cols / 2, rows / 2 + (ink * stretch) / 2)
    m.scale(1, stretch)
    m.fillText(WORD, 0, -metrics.actualBoundingBoxDescent)
    m.restore()
    const data = m.getImageData(0, 0, cols, rows).data
    for (let i = 0; i < cols * rows; i++) {
      if ((data[i * 4 + 3] ?? 0) > 110) {
        isLetter[i] = 1
        letters.push(i)
      }
    }
  }

  const base = document.createElement('canvas')
  base.width = Math.round(width * dpr)
  base.height = Math.round(height * dpr)
  const b = base.getContext('2d')
  if (b) {
    b.scale(dpr, dpr)
    const dot = cell * 0.5
    for (let i = 0; i < cols * rows; i++) {
      const x = (i % cols) * cell + (cell - dot) / 2
      const y = Math.floor(i / cols) * cell + (cell - dot) / 2
      if (isLetter[i]) {
        b.globalAlpha = 0.2
        b.fillStyle = colors.fg
        b.fillRect(x, y, dot, dot)
      } else if ((i % cols) % 2 === 0 && Math.floor(i / cols) % 2 === 0) {
        // A sparse background grid, so the field reads as a matrix, not just a word.
        b.globalAlpha = 0.18
        b.fillStyle = colors.subtle
        b.fillRect(x + dot / 4, y + dot / 4, dot / 2, dot / 2)
      }
    }
  }
  return { cell, cols, rows, letters, isLetter, base }
}

/**
 * The footer's signal field: MOHANNAD. as a dot-matrix wordmark. Packets of "traffic" stream
 * across it, a scan line sweeps through, and the pointer is a scanner lens that lights and
 * decrypts the dots beneath it (a tap sends a ripple on touch screens). Canvas, sized for the
 * device pixel ratio; time-based, so refresh rate doesn't change its speed; paused off screen;
 * a still frame with Reduce Motion.
 */
export default function SignalField() {
  const wrapRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [stats, setStats] = useState({ rate: 0, inspected: 0 })
  const [lens, setLens] = useState<{ x: number; y: number } | null>(null)

  useEffect(() => {
    const wrap = wrapRef.current
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!wrap || !canvas || !ctx) return

    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
    const random = createRandom(42)
    let colors = readColors()
    let grid: Grid | null = null
    let width = 0
    let height = 0
    let dpr = 1
    let packets: Packet[] = []
    let lit = new Float32Array(0)
    let glyphs: string[] = []
    let pointer: { x: number; y: number } | null = null
    let ripple: { x: number; y: number; t: number } | null = null
    let visible = false
    let frame = 0
    let last = 0
    let lastShuffle = 0
    let inspected = 0
    let crossings = 0
    let disposed = false

    const rebuild = () => {
      const rect = wrap.getBoundingClientRect()
      width = rect.width
      height = rect.height
      if (width < 10 || height < 10) return
      // Cap the backing store at 2x: sharper than that is invisible and costs fill rate.
      dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = Math.round(width * dpr)
      canvas.height = Math.round(height * dpr)
      grid = buildGrid(width, height, dpr, colors)
      lit = new Float32Array(grid.cols * grid.rows).fill(-1e9)
      glyphs = Array.from(
        { length: grid.cols * grid.rows },
        () => HEX[Math.floor(random() * 16)] ?? '0',
      )
      packets = Array.from({ length: PACKETS }, () =>
        spawnPacket(grid?.rows ?? 1, width, random, true),
      )
      draw(performance.now())
    }

    const draw = (t: number) => {
      if (!grid) return
      const { cell, cols, letters, isLetter, base } = grid
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(base, 0, 0)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      if (reduce) return

      // Light cells under the scan line and along packet paths.
      const sx = sweepX(t, width)
      const sweepCol = Math.floor(sx / cell)
      if (sweepCol >= 0 && sweepCol < cols) {
        for (let r = 0; r < grid.rows; r++) {
          const i = r * cols + sweepCol
          if (isLetter[i]) lit[i] = t
        }
      }
      for (const p of packets) {
        const col = Math.floor(p.x / cell)
        if (col >= 0 && col < cols) {
          const i = p.row * cols + col
          if (isLetter[i] && lit[i]! < t - 400) crossings++
          if (isLetter[i]) lit[i] = t
        }
      }

      // Wordmark cells: base glow + recent hits + the pointer lens + a touch ripple.
      const dot = cell * 0.5
      ctx.fillStyle = colors.fg
      ctx.font = `600 ${Math.round(cell * 1.15)}px "Geist Mono Variable", ui-monospace, monospace`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      for (const i of letters) {
        const cx = (i % cols) * cell + cell / 2
        const cy = Math.floor(i / cols) * cell + cell / 2
        let boost = decay(t - (lit[i] ?? -1e9)) * 0.75
        let near = 0
        if (pointer) {
          near = falloff(Math.hypot(cx - pointer.x, cy - pointer.y), LENS)
          boost += near * 0.8
        }
        if (ripple) {
          const radius = (t - ripple.t) * 0.45
          const ring = Math.abs(Math.hypot(cx - ripple.x, cy - ripple.y) - radius)
          boost += falloff(ring, 24) * Math.max(0, 1 - (t - ripple.t) / 1400)
        }
        if (boost < 0.03) continue
        ctx.globalAlpha = Math.min(1, 0.2 + boost)
        if (near > 0.55) {
          // Inside the lens the dots "decrypt" into hex digits.
          ctx.fillText(glyphs[i] ?? '0', cx, cy)
        } else {
          const s = dot * (1 + Math.min(boost, 1) * 0.35)
          ctx.fillRect(cx - s / 2, cy - s / 2, s, s)
        }
      }

      // Packets: a bright head with a fading tail, across the whole field.
      for (const p of packets) {
        const y = p.row * cell + (cell - dot) / 2
        for (let k = 0; k < p.tail; k++) {
          const x = p.x - k * cell
          if (x < -cell || x > width) continue
          ctx.globalAlpha = 0.85 * (1 - k / p.tail)
          ctx.fillRect(Math.floor(x / cell) * cell + (cell - dot) / 2, y, dot, dot)
        }
      }

      // The scan line itself: a thin bar with a soft trail.
      if (sx > -80 && sx < width + 80) {
        const g = ctx.createLinearGradient(sx - 60, 0, sx, 0)
        g.addColorStop(0, 'transparent')
        g.addColorStop(1, colors.fg)
        ctx.globalAlpha = 0.12
        ctx.fillStyle = g
        ctx.fillRect(sx - 60, 0, 60, height)
        ctx.globalAlpha = 0.5
        ctx.fillStyle = colors.fg
        ctx.fillRect(sx, 0, 1, height)
      }
      ctx.globalAlpha = 1
    }

    const loop = (t: number) => {
      frame = requestAnimationFrame(loop)
      // Clamp dt so a background tab or a hitch doesn't teleport the packets.
      const dt = last ? Math.min(t - last, 64) : 16
      last = t
      if (grid) packets = stepPackets(packets, dt, grid.rows, width, random)
      if (ripple && t - ripple.t > 1400) ripple = null
      // Refresh a few lens glyphs so the decrypted digits flicker: on a clock (every 60 ms),
      // not per frame, so a 144 Hz screen doesn't flicker faster than a 60 Hz one.
      if (pointer && grid && t - lastShuffle > 60) {
        lastShuffle = t
        for (let k = 0; k < 12; k++) {
          const i = Math.floor(random() * glyphs.length)
          glyphs[i] = DECRYPT_GLYPHS[Math.floor(random() * DECRYPT_GLYPHS.length)] ?? '0'
        }
      }
      draw(t)
    }

    const start = () => {
      if (reduce || frame || !visible || document.hidden || disposed) return
      last = 0
      frame = requestAnimationFrame(loop)
    }
    const stop = () => {
      cancelAnimationFrame(frame)
      frame = 0
    }

    // Packets per second and how many hit the wordmark, shown in the HUD once a second.
    const statsTimer = window.setInterval(() => {
      if (!frame) return
      inspected += crossings
      setStats({ rate: crossings, inspected })
      crossings = 0
    }, 1000)

    const local = (e: PointerEvent) => {
      const rect = wrap.getBoundingClientRect()
      return { x: e.clientX - rect.left, y: e.clientY - rect.top }
    }
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse' && e.pointerType !== 'pen') return
      pointer = local(e)
      setLens(pointer)
      if (reduce) draw(performance.now())
    }
    const onLeave = () => {
      pointer = null
      setLens(null)
    }
    const onDown = (e: PointerEvent) => {
      ripple = { ...local(e), t: performance.now() }
    }
    wrap.addEventListener('pointermove', onMove)
    wrap.addEventListener('pointerleave', onLeave)
    wrap.addEventListener('pointerdown', onDown)

    const io = new IntersectionObserver(([entry]) => {
      visible = !!entry?.isIntersecting
      if (visible) start()
      else stop()
    })
    io.observe(wrap)
    const onVisibility = () => (document.hidden ? stop() : start())
    document.addEventListener('visibilitychange', onVisibility)
    const ro = new ResizeObserver(() => rebuild())
    ro.observe(wrap)
    // A different screen (another monitor, browser zoom) changes the pixel ratio.
    const dprQuery = window.matchMedia?.(`(resolution: ${window.devicePixelRatio || 1}dppx)`)
    dprQuery?.addEventListener('change', rebuild)
    const unsubscribeTheme = subscribeTheme(() => {
      colors = readColors()
      rebuild()
    })

    // The wordmark needs its font before it can be rasterised.
    void Promise.all([
      document.fonts?.load('800 100px "Archivo Variable"'),
      document.fonts?.load('600 12px "Geist Mono Variable"'),
    ]).finally(() => {
      if (disposed) return
      rebuild()
      start()
    })

    return () => {
      disposed = true
      stop()
      window.clearInterval(statsTimer)
      io.disconnect()
      ro.disconnect()
      dprQuery?.removeEventListener('change', rebuild)
      unsubscribeTheme()
      document.removeEventListener('visibilitychange', onVisibility)
      wrap.removeEventListener('pointermove', onMove)
      wrap.removeEventListener('pointerleave', onLeave)
      wrap.removeEventListener('pointerdown', onDown)
    }
  }, [])

  return (
    <div ref={wrapRef} data-signal-field className="absolute inset-0 touch-pan-y select-none">
      <canvas ref={canvasRef} aria-hidden="true" className="size-full" />
      <p
        aria-hidden="true"
        className="pointer-events-none absolute top-3 right-0 font-mono text-[0.625rem] tracking-wider text-fg-subtle uppercase max-sm:hidden"
      >
        rx {String(stats.rate).padStart(2, '0')} pkt/s · inspected {stats.inspected}
      </p>
      {lens ? (
        <p
          aria-hidden="true"
          className="pointer-events-none absolute font-mono text-[0.625rem] tracking-wider whitespace-nowrap text-fg-muted uppercase"
          style={{ left: lens.x + 16, top: lens.y + 14 }}
        >
          x {String(Math.round(lens.x)).padStart(4, '0')} · y{' '}
          {String(Math.round(lens.y)).padStart(3, '0')}
        </p>
      ) : null}
    </div>
  )
}
