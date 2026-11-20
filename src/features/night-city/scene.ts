import type { Severity } from './alerts'
import { buildingAt, generateCity, PALM, type City } from './city'

export type SceneColors = {
  canvas: string
  fg: string
  muted: string
  subtle: string
  lineStrong: string
  signal: string
  signalStrong: string
  signalWash: string
  aviation: string
  severity: Record<Severity, string>
}

type SceneOptions = {
  colors: SceneColors
  reducedMotion: boolean
  /** Called once the skyline has finished rising. */
  onReady: () => void
}

export type Scene = {
  resize: (width: number, height: number) => void
  /** Start or resume animating (plays the build-up the first time). */
  start: () => void
  /** Pause (off screen, tab hidden). */
  stop: () => void
  destroy: () => void
  /** Host under a point in CSS pixels relative to the canvas, or null. */
  pick: (x: number, y: number) => number | null
  /** Just above a building's top, in CSS pixels relative to the canvas. */
  anchor: (index: number) => { x: number; y: number }
  city: () => City
  /**
   * Light up `count` hosts (neighbours, for an incident) with one alert group. Returns the group
   * id and its members; members is empty when no host is free.
   */
  raise: (severity: Severity, count: number) => { group: number; members: number[] }
  clear: (group: number) => void
  select: (index: number | null) => void
  /** Pointer position (CSS px) for the scanner and hover glow, or null when it leaves. */
  pointer: (x: number | null, y?: number) => void
}

const FONT_STACK = '"Geist Mono Variable", ui-monospace, "SFMono-Regular", Consolas, monospace'
const FLICKER_MS = 140

const easeOutCubic = (t: number) => 1 - (1 - t) ** 3
const clamp01 = (t: number) => Math.min(Math.max(t, 0), 1)
/** Frame-rate independent approach factor for exponential smoothing. */
const approach = (dt: number, tauMs: number) => 1 - Math.exp(-dt / tauMs)

/**
 * Draws the night-shift city on a canvas, one monospace character per grid cell.
 *
 * Outlines and windows live on cached offscreen layers (windows are redrawn only when traffic
 * changes, ~7 times a second); each frame composites them and draws only what moves: stars,
 * alert pulses, incident links, aviation lights, the scanner glow, hover highlights and the
 * water. Buildings rise pixel by pixel; every animation is time-based, so it looks the same at
 * 60Hz and 120Hz. Runs only while visible. With reduced motion it draws a still frame on change.
 */
export function createScene(canvas: HTMLCanvasElement, options: SceneOptions): Scene {
  const { colors, reducedMotion, onReady } = options
  const ctx = canvas.getContext('2d')
  const shellLayer = document.createElement('canvas')
  const windowLayer = document.createElement('canvas')
  const frontLayer = document.createElement('canvas')
  const layers = [shellLayer, windowLayer, frontLayer]

  let width = 0
  let height = 0
  let dpr = 1
  let cell = { w: 7, h: 15, size: 11 }
  let origin = { x: 0, y: 0 }
  let city: City = { cols: 0, rows: 0, ground: 0, buildings: [], palms: [], stars: [] }

  let lit: boolean[][] = []
  let active: boolean[][] = []
  let hover: Float32Array = new Float32Array(0)
  let ripples: { x: number; y: number; speed: number; len: number; phase: number }[] = []

  let raf = 0
  let running = false
  let lastTime = 0
  let lastFlicker = 0
  let buildStart = -1
  let built = reducedMotion
  let buildPlan: { delay: number; duration: number }[] = []
  let windowsDirty = true
  let staticDirty = true

  const alertBy = new Map<number, { severity: Severity; group: number }>()
  const groups = new Map<number, { severity: Severity; members: number[] }>()
  let nextGroup = 1
  let selected: number | null = null
  let hovered: number | null = null
  let pointerX: number | null = null
  let beamX = -200

  const font = () => `${cell.size}px ${FONT_STACK}`
  const px = (col: number) => origin.x + col * cell.w
  const py = (row: number) => origin.y + row * cell.h
  const groundY = () => py(city.ground + 1)

  function prepare(target: CanvasRenderingContext2D) {
    target.setTransform(dpr, 0, 0, dpr, 0, 0)
    target.font = font()
    target.textBaseline = 'top'
  }

  function glyph(target: CanvasRenderingContext2D, char: string, col: number, row: number) {
    target.fillText(char, px(col), py(row))
  }

  function drawOutline(target: CanvasRenderingContext2D, index: number) {
    const b = city.buildings[index]
    if (!b) return
    b.sprite.forEach((line, r) => {
      for (let c = 0; c < line.length; c++) {
        const char = line[c]
        if (char && char !== ' ') glyph(target, char, b.x + c, b.roof + r)
      }
    })
  }

  /** Outlines and palms: static per size, redrawn on resize. */
  function renderStatic() {
    const shell = shellLayer.getContext('2d')
    const front = frontLayer.getContext('2d')
    if (!shell || !front) return
    for (const target of [shell, front]) {
      prepare(target)
      target.clearRect(0, 0, width, height)
    }
    shell.fillStyle = colors.subtle
    shell.globalAlpha = 0.55
    city.buildings.forEach((_, i) => drawOutline(shell, i))
    shell.globalAlpha = 1

    // Palms stand in front of the buildings: clear their cells first, then draw them.
    for (const col of city.palms) {
      PALM.forEach((line, r) => {
        const row = city.ground - (PALM.length - 1) + r
        for (let c = 0; c < line.length; c++) {
          const char = line[c]
          if (!char || char === ' ') continue
          front.fillStyle = colors.canvas
          front.fillRect(px(col - 1 + c), py(row), cell.w, cell.h)
          front.fillStyle = colors.signal
          front.globalAlpha = r === 0 ? 0.6 : 0.4
          glyph(front, char, col - 1 + c, row)
          front.globalAlpha = 1
        }
      })
    }
    staticDirty = false
  }

  /** Window lights: redrawn when traffic or alerts change. */
  function renderWindows() {
    const target = windowLayer.getContext('2d')
    if (!target) return
    prepare(target)
    target.clearRect(0, 0, width, height)
    city.buildings.forEach((b, i) => {
      if (alertBy.has(i)) return // drawn live, pulsing
      b.windows.forEach((win, wi) => {
        if (lit[i]?.[wi]) {
          target.fillStyle = active[i]?.[wi] ? colors.signal : colors.muted
          target.globalAlpha = 0.78
          glyph(target, '▪', win.col, win.row)
        } else {
          target.fillStyle = colors.lineStrong
          target.globalAlpha = 1
          glyph(target, '·', win.col, win.row)
        }
      })
    })
    target.globalAlpha = 1
    windowsDirty = false
  }

  function seedState() {
    lit = city.buildings.map((b) => b.windows.map(() => Math.random() < 0.45))
    active = city.buildings.map((b) => b.windows.map(() => Math.random() < 0.08))
    hover = new Float32Array(city.buildings.length)
    const waterTop = groundY() + 4
    const waterBottom = height - 3
    ripples = Array.from({ length: Math.round(city.cols * 0.55) }, () => ({
      x: Math.random() * (width + 40),
      y: waterTop + Math.random() * Math.max(waterBottom - waterTop, 4),
      speed: 5 + Math.random() * 14,
      len: 5 + Math.random() * 16,
      phase: Math.random() * Math.PI * 2,
    }))
  }

  function planBuild() {
    const centre = city.cols / 2
    buildPlan = city.buildings.map((b) => {
      const distance = Math.abs(b.x + b.w / 2 - centre) / Math.max(centre, 1)
      return { delay: distance * 700 + Math.random() * 200, duration: 700 + Math.random() * 400 }
    })
  }

  const buildEnd = () => Math.max(0, ...buildPlan.map((p) => p.delay + p.duration))

  function progress(index: number, now: number): number {
    if (built) return 1
    const plan = buildPlan[index]
    if (!plan || buildStart < 0) return 0
    return easeOutCubic(clamp01((now - buildStart - plan.delay) / plan.duration))
  }

  function flicker() {
    // A few host windows change: ordinary traffic.
    const total = lit.reduce((n, list) => n + list.length, 0)
    const changes = Math.max(1, Math.round(total * 0.012))
    for (let k = 0; k < changes; k++) {
      const bi = Math.floor(Math.random() * lit.length)
      const list = lit[bi]
      if (!list?.length) continue
      const wi = Math.floor(Math.random() * list.length)
      list[wi] = !list[wi]
      if (Math.random() < 0.15) {
        const a = active[bi]
        if (a) a[wi] = !a[wi]
      }
    }
    windowsDirty = true
  }

  /** A building's layers, revealed from the ground up to `p` of its height (sub-pixel smooth). */
  function drawRising(index: number, p: number) {
    if (!ctx) return
    const b = city.buildings[index]
    if (!b || p <= 0) return
    const x = Math.max(px(b.x) - 2, 0)
    const w = Math.min(b.w * cell.w + 4, width - x)
    const bottom = groundY()
    const top = Math.max(bottom - p * (b.h + 2) * cell.h, 0)
    const h = bottom - top
    if (w <= 0 || h <= 0) return
    for (const layer of [shellLayer, windowLayer]) {
      ctx.drawImage(layer, x * dpr, top * dpr, w * dpr, h * dpr, x, top, w, h)
    }
  }

  function drawWater(t: number, reveal: number) {
    if (!ctx || reveal <= 0) return
    const y0 = groundY()
    const bottom = height
    ctx.globalAlpha = reveal

    // A faint green cast to the water, fading down.
    const wash = ctx.createLinearGradient(0, y0, 0, bottom)
    wash.addColorStop(0, colors.signalWash)
    wash.addColorStop(1, 'transparent')
    ctx.globalAlpha = 0.55 * reveal
    ctx.fillStyle = wash
    ctx.fillRect(0, y0, width, bottom - y0)

    // The promenade's edge.
    ctx.globalAlpha = reveal
    ctx.fillStyle = colors.lineStrong
    ctx.fillRect(0, y0, width, 1)

    // Reflections: each lit window becomes a short, wobbling streak of light, fading downward.
    const streak = Math.max((bottom - y0 - 8) / 3 - 2, 2)
    city.buildings.forEach((b, i) => {
      const alerting = alertBy.get(i)
      b.windows.forEach((win, wi) => {
        const isLit = alerting ? true : lit[i]?.[wi]
        if (!isLit) return
        ctx.fillStyle = alerting
          ? colors.severity[alerting.severity]
          : active[i]?.[wi]
            ? colors.signal
            : colors.muted
        const shimmer = reducedMotion ? 0.85 : 0.75 + 0.25 * Math.sin(t * 2.3 + win.col)
        for (let k = 0; k < 3; k++) {
          const wobble = reducedMotion ? 0 : Math.sin(t * 1.6 + win.col * 0.7 + k * 1.1) * 1.4
          const w = cell.w * 0.34 * (1 - k * 0.22)
          ctx.globalAlpha = (0.2 - k * 0.055) * shimmer * reveal
          ctx.fillRect(
            px(win.col) + (cell.w - w) / 2 + wobble,
            y0 + 3 + k * (streak + 2),
            w,
            streak,
          )
        }
      })
    })

    // Ripples drifting slowly along the water.
    ctx.fillStyle = colors.subtle
    for (const r of ripples) {
      const x = reducedMotion ? r.x : ((r.x + r.speed * t) % (width + 40)) - 20
      ctx.globalAlpha = (0.1 + 0.16 * (0.5 + 0.5 * Math.sin(t * 0.9 + r.phase))) * reveal
      ctx.fillRect(x, r.y, r.len, 1)
    }
    ctx.globalAlpha = 1
  }

  function drawLinks(t: number) {
    if (!ctx) return
    for (const { severity, members } of groups.values()) {
      if (members.length < 2) continue
      ctx.strokeStyle = colors.severity[severity]
      ctx.lineWidth = 1
      ctx.setLineDash([3, 4])
      ctx.lineDashOffset = reducedMotion ? 0 : -t * 18
      ctx.globalAlpha = 0.75
      ctx.beginPath()
      for (let k = 0; k < members.length - 1; k++) {
        const a = city.buildings[members[k] ?? -1]
        const b = city.buildings[members[k + 1] ?? -1]
        if (!a || !b) continue
        const ax = px(a.x + a.w / 2)
        const bx = px(b.x + b.w / 2)
        const ay = py(a.roof - 1)
        const by = py(b.roof - 1)
        const lift = Math.min(ay, by) - cell.h * 1.5 - Math.abs(bx - ax) * 0.12
        ctx.moveTo(ax, ay)
        ctx.quadraticCurveTo((ax + bx) / 2, Math.max(lift, 2), bx, by)
      }
      ctx.stroke()
      ctx.setLineDash([])
      ctx.globalAlpha = 1
    }
  }

  function drawBeam(now: number, dt: number) {
    if (!ctx || reducedMotion) return
    const sweep = ((now / 9000) % 1) * (width + 240) - 120
    const target = pointerX ?? sweep
    // Snap across the wrap (it's off screen); otherwise glide.
    if (pointerX === null && Math.abs(target - beamX) > width * 0.6) beamX = target
    else beamX += (target - beamX) * approach(dt, pointerX === null ? 500 : 90)

    const bottom = groundY()
    const spread = cell.w * 4
    const glow = ctx.createLinearGradient(beamX - spread, 0, beamX + spread, 0)
    glow.addColorStop(0, 'transparent')
    glow.addColorStop(0.5, colors.signal)
    glow.addColorStop(1, 'transparent')
    ctx.globalCompositeOperation = 'lighter'
    ctx.globalAlpha = 0.13
    ctx.fillStyle = glow
    ctx.fillRect(beamX - spread, 0, spread * 2, bottom)
    const core = ctx.createLinearGradient(0, 0, 0, bottom)
    core.addColorStop(0, 'transparent')
    core.addColorStop(1, colors.signal)
    ctx.globalAlpha = 0.35
    ctx.fillStyle = core
    ctx.fillRect(beamX - 0.5, 0, 1, bottom)
    ctx.globalCompositeOperation = 'source-over'
    ctx.globalAlpha = 1
  }

  function draw(now: number) {
    if (!ctx) return
    const dt = lastTime ? Math.min(now - lastTime, 64) : 16
    lastTime = now
    const t = reducedMotion ? 0 : now / 1000

    if (!built && buildStart >= 0 && now - buildStart > buildEnd()) built = true
    if (staticDirty) renderStatic()
    if (windowsDirty) renderWindows()

    prepare(ctx)
    ctx.clearRect(0, 0, width, height)
    const reveal = built ? 1 : clamp01((now - buildStart - buildEnd() * 0.55) / 700)

    // Sky.
    ctx.fillStyle = colors.subtle
    for (const star of city.stars) {
      const twinkle = reducedMotion
        ? 0.35
        : 0.2 + 0.3 * (0.5 + 0.5 * Math.sin(t * 1.3 + star.phase))
      ctx.globalAlpha = twinkle * reveal
      glyph(ctx, '·', star.col, star.row)
    }
    ctx.globalAlpha = 1

    // Buildings.
    if (built) {
      ctx.drawImage(shellLayer, 0, 0, width, height)
      ctx.drawImage(windowLayer, 0, 0, width, height)
    } else {
      city.buildings.forEach((_, i) => drawRising(i, progress(i, now)))
    }

    // Hover and selection: the outline brightens smoothly.
    city.buildings.forEach((_, i) => {
      const goal = i === selected ? 1 : i === hovered ? 0.7 : 0
      const level =
        (hover[i] ?? 0) + (goal - (hover[i] ?? 0)) * (reducedMotion ? 1 : approach(dt, 140))
      hover[i] = level
      if (level < 0.02 || progress(i, now) < 1) return
      ctx.fillStyle = colors.fg
      ctx.globalAlpha = level * 0.9
      drawOutline(ctx, i)
    })
    ctx.globalAlpha = 1

    // Alerts: windows pulse in the severity colour, with a marker overhead.
    const pulse = reducedMotion ? 1 : 0.5 + 0.5 * Math.sin(t * Math.PI * 2 * 1.1)
    for (const [i, { severity, group }] of alertBy) {
      const b = city.buildings[i]
      if (!b || progress(i, now) < 1) continue
      ctx.fillStyle = colors.severity[severity]
      ctx.globalAlpha = 0.45 + 0.55 * pulse
      for (const win of b.windows) glyph(ctx, '▪', win.col, win.row)
      const markerRow = (b.light?.row ?? b.roof) - 1
      const incident = (groups.get(group)?.members.length ?? 1) > 1
      ctx.globalAlpha = 0.35 + 0.65 * pulse
      glyph(ctx, incident ? '◆' : '▲', b.x + Math.floor(b.w / 2), markerRow)
    }
    ctx.globalAlpha = 1
    drawLinks(t)

    // Aviation lights: a soft flash, staggered per tower.
    ctx.fillStyle = colors.aviation
    city.buildings.forEach((b, i) => {
      if (!b.light || progress(i, now) < 1) return
      const flash = reducedMotion ? 1 : Math.max(0, Math.sin(t * Math.PI * 2 * 0.55 + i * 1.7)) ** 6
      ctx.globalAlpha = 0.2 + 0.8 * flash
      glyph(ctx, '•', b.light.col, b.light.row)
    })
    ctx.globalAlpha = reveal
    ctx.drawImage(frontLayer, 0, 0, width, height)
    ctx.globalAlpha = 1

    if (built) drawBeam(now, dt)
    drawWater(t, reveal)
  }

  function frame(now: number) {
    raf = requestAnimationFrame(frame)
    if (built && now - lastFlicker > FLICKER_MS) {
      lastFlicker = now
      flicker()
    }
    draw(now)
  }

  function pick(x: number, y: number): number | null {
    return buildingAt(
      city,
      Math.floor((x - origin.x) / cell.w),
      Math.floor((y - origin.y) / cell.h),
    )
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
      for (const c of [canvas, ...layers]) {
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
      if (cols !== city.cols || rows !== city.rows) {
        city = generateCity(cols, rows)
        alertBy.clear()
        groups.clear()
        selected = null
        hovered = null
        if (!built) planBuild()
      }
      seedState()
      staticDirty = true
      windowsDirty = true
      requestDraw()
    },
    start() {
      if (running) return
      running = true
      if (buildStart < 0) {
        buildStart = performance.now()
        if (!built) planBuild()
        window.setTimeout(onReady, reducedMotion ? 0 : buildEnd() + 150)
      }
      if (reducedMotion) {
        requestDraw()
        return
      }
      lastTime = 0
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
    pick,
    anchor(index) {
      const b = city.buildings[index]
      if (!b) return { x: width / 2, y: height / 2 }
      return { x: px(b.x + b.w / 2), y: py(Math.max((b.light?.row ?? b.roof) - 1, 0)) }
    },
    city: () => city,
    raise(severity, count) {
      const free = city.buildings
        .map((b, i) => ({ b, i }))
        .filter(({ b, i }) => b.windows.length >= 2 && i !== selected && !alertBy.has(i))
      const seed = free[Math.floor(Math.random() * free.length)]
      if (!seed) return { group: 0, members: [] }
      const centre = (b: (typeof free)[number]['b']) => b.x + b.w / 2
      // An incident spreads to neighbours, the way lateral movement would.
      const members = [
        seed,
        ...free
          .filter((f) => f.i !== seed.i)
          .sort(
            (a, b) =>
              Math.abs(centre(a.b) - centre(seed.b)) - Math.abs(centre(b.b) - centre(seed.b)),
          )
          .slice(0, Math.max(count - 1, 0)),
      ]
        .sort((a, b) => a.b.x - b.b.x)
        .map((m) => m.i)
      const group = nextGroup++
      groups.set(group, { severity, members })
      for (const i of members) alertBy.set(i, { severity, group })
      windowsDirty = true
      requestDraw()
      return { group, members }
    },
    clear(group) {
      const g = groups.get(group)
      if (!g) return
      for (const i of g.members) alertBy.delete(i)
      groups.delete(group)
      windowsDirty = true
      requestDraw()
    },
    select(index) {
      selected = index
      requestDraw()
    },
    pointer(x, y) {
      pointerX = x
      hovered = x === null || y === undefined ? null : pick(x, y)
      if (reducedMotion) requestDraw()
    },
  }
}
