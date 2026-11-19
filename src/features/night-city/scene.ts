import type { Severity } from './alerts'
import { buildingAt, generateCity, type City } from './city'

export type SceneColors = {
  fg: string
  muted: string
  subtle: string
  lineStrong: string
  signal: string
  signalStrong: string
  aviation: string
  severity: Record<Severity, string>
}

type SceneOptions = {
  colors: SceneColors
  reducedMotion: boolean
  /** Called once the skyline has finished building. */
  onReady: () => void
}

export type Scene = {
  resize: (width: number, height: number) => void
  /** Start or resume animating (plays the build-up the first time). */
  start: () => void
  /** Pause (off screen, tab hidden). */
  stop: () => void
  destroy: () => void
  /** Building under a point in CSS pixels, relative to the canvas. */
  pick: (x: number, y: number) => number | null
  /** Centre of a building's roof, in CSS pixels relative to the canvas. */
  anchor: (index: number) => { x: number; y: number }
  city: () => City
  /** Light up a building with an alert; returns its index, or null if the city is empty. */
  raiseAlert: (severity: Severity) => number | null
  clearAlert: () => void
  select: (index: number | null) => void
  /** Pointer column for the scanner beam (CSS px), or null to let it sweep on its own. */
  pointer: (x: number | null) => void
}

const FRAME_MS = 1000 / 30
const FONT_STACK = '"Geist Mono Variable", ui-monospace, "SFMono-Regular", Consolas, monospace'

const easeOutCubic = (t: number) => 1 - (1 - t) ** 3
const clamp01 = (t: number) => Math.min(Math.max(t, 0), 1)

/**
 * Draws the night-shift city on a canvas, one monospace character per grid cell. Walls and roofs
 * are cached on an offscreen layer once built; each frame only redraws windows, stars, lights,
 * the scanner beam and the alert. Runs at most 30fps and only while visible. With reduced motion
 * it draws a still, fully built city and redraws only when something changes.
 */
export function createScene(canvas: HTMLCanvasElement, options: SceneOptions): Scene {
  const { colors, reducedMotion, onReady } = options
  const ctx = canvas.getContext('2d')
  const layer = document.createElement('canvas')
  const layerCtx = layer.getContext('2d')

  let width = 0
  let height = 0
  let dpr = 1
  let cell = { w: 7, h: 15, size: 11 }
  let origin = { x: 0, y: 0 }
  let city: City = { cols: 0, rows: 0, ground: 0, buildings: [], stars: [], labels: [] }

  // Per-window state, flattened per building.
  let lit: boolean[][] = []
  let active: boolean[][] = []

  let raf = 0
  let running = false
  let lastFrame = 0
  let buildStart = -1
  let built = reducedMotion
  let buildPlan: { delay: number; duration: number }[] = []
  let layerDirty = true

  let alert: { index: number; severity: Severity } | null = null
  let selected: number | null = null
  let pointerX: number | null = null
  let beamCol = -10

  const font = () => `${cell.size}px ${FONT_STACK}`
  const px = (col: number) => origin.x + col * cell.w
  const py = (row: number) => origin.y + row * cell.h

  function seedWindows() {
    lit = city.buildings.map((b) => b.windows.map(() => !!b.landmark || Math.random() < 0.45))
    active = city.buildings.map((b) => b.windows.map(() => Math.random() < 0.08))
  }

  function planBuild() {
    const centre = city.cols / 2
    buildPlan = city.buildings.map((b) => {
      const distance = Math.abs(b.x + b.w / 2 - centre) / Math.max(centre, 1)
      return { delay: distance * 650 + Math.random() * 220, duration: 520 + Math.random() * 380 }
    })
  }

  const buildEnd = () => Math.max(0, ...buildPlan.map((p) => p.delay + p.duration))

  function progress(index: number, now: number): number {
    if (built) return 1
    const plan = buildPlan[index]
    if (!plan || buildStart < 0) return 0
    return easeOutCubic(clamp01((now - buildStart - plan.delay) / plan.duration))
  }

  function glyph(target: CanvasRenderingContext2D, char: string, col: number, row: number) {
    target.fillText(char, px(col), py(row))
  }

  /** First row of a building that's visible while it rises `shownRows` from the ground. */
  const topRowFor = (shownRows: number) => city.ground + 1 - shownRows

  /** Outline of one building, from the ground up to `shownRows`. */
  function drawShell(target: CanvasRenderingContext2D, index: number, shownRows: number) {
    const b = city.buildings[index]
    if (!b) return
    const isSelected = selected === index
    // Landmarks read a touch brighter than ordinary buildings; the Grand Mosque glows.
    target.fillStyle = isSelected || b.bright ? colors.fg : colors.subtle
    target.globalAlpha = isSelected ? 0.95 : b.bright ? 0.7 : b.landmark ? 0.7 : 0.55
    const topRow = topRowFor(shownRows)

    if (b.sprite) {
      b.sprite.forEach((line, r) => {
        const row = b.roof + r
        if (row < topRow) return
        for (let c = 0; c < line.length; c++) {
          const char = line[c]
          if (char && char !== ' ') glyph(target, char, b.x + c, row)
        }
      })
      target.globalAlpha = 1
      return
    }

    for (let row = Math.max(topRow, b.roof + 1); row <= city.ground; row++) {
      glyph(target, '│', b.x, row)
      glyph(target, '│', b.x + b.w - 1, row)
    }
    if (topRow <= b.roof) {
      const round = b.roofStyle === 'round'
      glyph(target, round ? '╭' : '┌', b.x, b.roof)
      for (let col = b.x + 1; col < b.x + b.w - 1; col++) glyph(target, '─', col, b.roof)
      glyph(target, round ? '╮' : '┐', b.x + b.w - 1, b.roof)
      if (b.tower) glyph(target, '│', b.x + Math.floor(b.w / 2), b.roof - 1)
    }
    target.globalAlpha = 1
  }

  /** The Corniche: ripples, the city's lights reflected in the water, landmark names. */
  function drawWater(t: number, alpha: number) {
    if (!ctx || alpha <= 0) return
    const first = city.ground + 1
    const labelRow = city.rows - 1 > first ? city.rows - 1 : -1
    const labelled = new Set<number>()
    if (labelRow >= 0) {
      ctx.fillStyle = colors.subtle
      ctx.globalAlpha = 0.85 * alpha
      for (const label of city.labels) {
        const start = Math.round(label.col - label.text.length / 2)
        // Keep a clear cell either side, so ripples never run into the name.
        labelled.add(start - 1)
        labelled.add(start + label.text.length)
        for (let i = 0; i < label.text.length; i++) {
          const char = label.text[i]
          if (!char || char === ' ') continue
          labelled.add(start + i)
          glyph(ctx, char, start + i, labelRow)
        }
      }
    }

    // Reflections of lit windows, shimmering on the first row of water.
    city.buildings.forEach((b, i) => {
      b.windows.forEach((win, wi) => {
        if (!(lit[i]?.[wi] ?? false)) return
        const shimmer = reducedMotion ? 0.5 : 0.5 + 0.5 * Math.sin(t * 2.2 + win.col * 0.9 + i)
        ctx.fillStyle = b.bright ? colors.fg : colors.muted
        ctx.globalAlpha = (0.12 + 0.2 * shimmer) * alpha
        glyph(ctx, '╌', win.col, first)
      })
    })

    // Slow ripples drifting along the water.
    const drift = reducedMotion ? 0 : Math.floor(t * 1.6)
    ctx.fillStyle = colors.subtle
    for (let row = first; row < city.rows; row++) {
      for (let col = 0; col < city.cols; col++) {
        if (row === labelRow && labelled.has(col)) continue
        if ((col * 3 + row * 5 + drift) % 11 !== 0) continue
        ctx.globalAlpha = 0.28 * alpha
        glyph(ctx, '~', col, row)
      }
    }
    ctx.globalAlpha = 1
  }

  function renderLayer() {
    if (!layerCtx) return
    layerCtx.setTransform(dpr, 0, 0, dpr, 0, 0)
    layerCtx.clearRect(0, 0, width, height)
    layerCtx.font = font()
    layerCtx.textBaseline = 'top'
    city.buildings.forEach((b, i) => drawShell(layerCtx, i, b.h))
    layerDirty = false
  }

  function flicker() {
    // A handful of host windows change each frame: ordinary traffic. Landmarks stay lit.
    const total = lit.reduce((n, list) => n + list.length, 0)
    const changes = Math.max(1, Math.round(total * 0.004))
    for (let k = 0; k < changes; k++) {
      const bi = Math.floor(Math.random() * lit.length)
      const list = lit[bi]
      if (!list?.length || city.buildings[bi]?.landmark) continue
      const wi = Math.floor(Math.random() * list.length)
      list[wi] = !list[wi]
      if (Math.random() < 0.15) {
        const a = active[bi]
        if (a) a[wi] = !a[wi]
      }
    }
  }

  function draw(now: number) {
    if (!ctx) return
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, width, height)
    ctx.font = font()
    ctx.textBaseline = 'top'

    const t = now / 1000
    const settled = built || (buildStart >= 0 && now - buildStart > buildEnd())
    if (settled && !built) built = true

    // Sky.
    const skyAlpha = built ? 1 : clamp01((now - buildStart - buildEnd() * 0.6) / 600)
    if (skyAlpha > 0) {
      ctx.fillStyle = colors.subtle
      for (const star of city.stars) {
        const twinkle = reducedMotion
          ? 0.35
          : 0.2 + 0.3 * (0.5 + 0.5 * Math.sin(t * 1.3 + star.phase))
        ctx.globalAlpha = twinkle * skyAlpha
        glyph(ctx, '·', star.col, star.row)
      }
      ctx.globalAlpha = 1
    }

    // Scanner beam: sweeps on its own, or follows a mouse.
    let beam: number | null = null
    if (!reducedMotion && built) {
      const sweep = ((now / 9000) % 1) * (city.cols + 24) - 12
      const target = pointerX === null ? sweep : (pointerX - origin.x) / cell.w
      beamCol += (target - beamCol) * (pointerX === null ? 1 : 0.18)
      beam = beamCol
      const x = px(beam) + cell.w / 2
      const gradient = ctx.createLinearGradient(0, 0, 0, height)
      gradient.addColorStop(0, 'transparent')
      gradient.addColorStop(1, colors.signal)
      ctx.globalAlpha = 0.22
      ctx.fillStyle = gradient
      ctx.fillRect(x - 0.5, 0, 1, height)
      ctx.globalAlpha = 1
    }

    // Buildings: cached shells once built, animated while rising.
    if (built) {
      if (layerDirty) renderLayer()
      ctx.drawImage(layer, 0, 0, width, height)
    } else {
      city.buildings.forEach((b, i) => {
        const p = progress(i, now)
        if (p > 0) drawShell(ctx, i, Math.ceil(p * b.h))
      })
    }

    drawWater(t, skyAlpha)

    const blinkOn = reducedMotion || Math.sin(t * Math.PI * 2 * 1.4) > -0.2

    city.buildings.forEach((b, i) => {
      const p = progress(i, now)
      if (p <= 0) return
      const topRow = topRowFor(Math.ceil(p * b.h))
      const alerting = alert?.index === i
      const sevColor = alert ? colors.severity[alert.severity] : colors.signal

      b.windows.forEach((win, wi) => {
        if (win.row < topRow) return
        const isLit = lit[i]?.[wi] ?? false
        const near = beam !== null && Math.abs(win.col - beam) < 2.5
        if (b.landmark) {
          // Landmarks keep their lights on, warm and steady.
          ctx.fillStyle = b.bright ? colors.fg : colors.muted
          ctx.globalAlpha = b.bright ? 0.8 : 0.7
          glyph(ctx, '▪', win.col, win.row)
        } else if (alerting) {
          ctx.fillStyle = blinkOn ? sevColor : colors.lineStrong
          ctx.globalAlpha = blinkOn ? 1 : 0.8
          glyph(ctx, '▪', win.col, win.row)
        } else if (isLit) {
          ctx.fillStyle = near
            ? colors.signalStrong
            : active[i]?.[wi]
              ? colors.signal
              : colors.muted
          ctx.globalAlpha = near ? 1 : 0.75
          glyph(ctx, '▪', win.col, win.row)
        } else {
          ctx.fillStyle = near ? colors.signal : colors.lineStrong
          ctx.globalAlpha = near ? 0.7 : 1
          glyph(ctx, '·', win.col, win.row)
        }
      })
      ctx.globalAlpha = 1

      if (p < 1) return
      const centre = b.x + Math.floor(b.w / 2)
      // Aviation light on towers.
      if (b.tower && b.roof >= 2) {
        const on = reducedMotion || Math.sin(t * Math.PI * 2 * 0.6 + i) > 0.3
        ctx.fillStyle = colors.aviation
        ctx.globalAlpha = on ? 1 : 0.25
        glyph(ctx, '•', centre, b.roof - 2)
        ctx.globalAlpha = 1
      }
      // Alert marker over the roof.
      if (alerting && b.roof >= 1) {
        ctx.fillStyle = sevColor
        ctx.globalAlpha = blinkOn ? 1 : 0.35
        glyph(ctx, '▲', b.tower ? centre + 1 : centre, b.roof - 1)
        ctx.globalAlpha = 1
      }
    })
  }

  function frame(now: number) {
    raf = requestAnimationFrame(frame)
    if (now - lastFrame < FRAME_MS) return
    lastFrame = now
    if (built) flicker()
    draw(now)
  }

  /** One-off redraw (reduced motion, or a change while paused). */
  function requestDraw() {
    if (running && !reducedMotion) return
    requestAnimationFrame((now) => draw(now))
  }

  return {
    resize(nextWidth, nextHeight) {
      if (!ctx || nextWidth <= 0 || nextHeight <= 0) return
      width = nextWidth
      height = nextHeight
      dpr = Math.min(window.devicePixelRatio || 1, 2)
      for (const c of [canvas, layer]) {
        c.width = Math.round(width * dpr)
        c.height = Math.round(height * dpr)
      }
      const size = width < 640 ? 10 : 12
      ctx.font = `${size}px ${FONT_STACK}`
      const w = ctx.measureText('M').width || size * 0.6
      cell = { w, h: Math.round(size * 1.35), size }
      const cols = Math.floor(width / w)
      const rows = Math.floor(height / cell.h)
      // Centre the grid horizontally; sit it on the bottom edge.
      origin = { x: (width - cols * w) / 2, y: height - rows * cell.h }
      const changed = cols !== city.cols || rows !== city.rows
      if (changed) {
        city = generateCity(cols, rows)
        seedWindows()
        if (!built) planBuild()
        alert = null
        selected = null
      }
      layerDirty = true
      if (!running || reducedMotion) requestDraw()
    },
    start() {
      if (running) return
      running = true
      if (buildStart < 0) {
        buildStart = performance.now()
        if (!built) planBuild()
        window.setTimeout(onReady, reducedMotion ? 0 : buildEnd() + 200)
      }
      if (reducedMotion) {
        requestDraw()
        return
      }
      raf = requestAnimationFrame(frame)
    },
    stop() {
      running = false
      cancelAnimationFrame(raf)
    },
    destroy() {
      running = false
      cancelAnimationFrame(raf)
    },
    pick(x, y) {
      const col = Math.floor((x - origin.x) / cell.w)
      const row = Math.floor((y - origin.y) / cell.h)
      return buildingAt(city, col, row)
    },
    anchor(index) {
      const b = city.buildings[index]
      if (!b) return { x: width / 2, y: height / 2 }
      return { x: px(b.x + b.w / 2), y: py(Math.max(b.roof - 1, 0)) }
    },
    city: () => city,
    raiseAlert(severity) {
      const candidates = city.buildings
        .map((b, i) => ({ b, i }))
        // Only hosts raise alerts; landmarks are scenery.
        .filter(({ b, i }) => !b.landmark && b.windows.length >= 2 && i !== selected)
      const choice = candidates[Math.floor(Math.random() * candidates.length)]
      if (!choice) return null
      alert = { index: choice.i, severity }
      requestDraw()
      return choice.i
    },
    clearAlert() {
      alert = null
      requestDraw()
    },
    select(index) {
      if (selected === index) return
      selected = index
      layerDirty = true
      requestDraw()
    },
    pointer(x) {
      pointerX = x
    },
  }
}
