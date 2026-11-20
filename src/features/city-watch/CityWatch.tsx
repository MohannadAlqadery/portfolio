import { useEffect, useRef } from 'react'
import { createRandom } from '@/lib/random'
import { getTheme, subscribeTheme } from '@/lib/theme'
import { drawFigure } from './figure'
import {
  ACCESS_EVENTS,
  ADVISORIES,
  alpha,
  ASSET_EVENTS,
  buildCity,
  buildWalkers,
  cablePoint,
  ease,
  GROUND,
  gait,
  mix,
  packetAt,
  PANEL_WORDS,
  paletteFor,
  presence,
  PROFILES,
  ROW_FEET,
  ROW_HEIGHT,
  SHOP_H,
  topOf,
  walkerX,
  type City,
  type Palette,
  type Severity,
  type Storefront,
  type Camera,
  type Tokens,
  type Tower,
  type Walker,
} from './scene'

/*
 * The footer's city, watched from a SOC. A dense night city in the page's own black and white
 * (overcast day in the light theme) where the security work is the story: buildings are hosts that
 * get patched in waves, new CVEs ping in, an advisory ticker scrolls, packets run along rooftop
 * cables and malicious ones are dropped at a firewall, and a profiler checks passers-by's devices
 * for missing updates and anomalies, then marks them resolved. Colour appears only as severity.
 *
 * Static parts render once per size and theme; each frame draws only what moves. Nothing reacts to
 * the pointer.
 */

const MONO = '"Geist Mono Variable", "Noto Sans Arabic", "Segoe UI", ui-monospace, monospace'

function readTokens(): Tokens {
  const css = getComputedStyle(document.documentElement)
  const v = (name: string, fallback: string) => css.getPropertyValue(name).trim() || fallback
  return {
    canvas: v('--color-canvas', '#0a0a0a'),
    fg: v('--color-fg', '#f2f2f2'),
    muted: v('--color-fg-muted', '#a8a8a8'),
    subtle: v('--color-fg-subtle', '#858585'),
    line: v('--color-line', '#232323'),
    critical: v('--color-sev-critical', '#e5534b'),
    high: v('--color-sev-high', '#f0883e'),
    medium: v('--color-sev-medium', '#e8b14a'),
  }
}

function layer(w: number, h: number, dpr: number) {
  const c = document.createElement('canvas')
  c.width = Math.max(1, Math.round(w * dpr))
  c.height = Math.max(1, Math.round(h * dpr))
  const ctx = c.getContext('2d')
  ctx?.scale(dpr, dpr)
  return { c, ctx }
}

const sevColor = (p: Palette, sev: Severity) => p[sev]

/** Window rectangle of cell `i` on a tower, in px. */
function windowRect(t: Tower, i: number, H: number) {
  const x = t.x * H
  const w = t.w * H
  const top = topOf(t) * H
  const bodyBottom = (GROUND - (t.layer === 2 ? SHOP_H : 0)) * H
  const cw = w / t.cols
  const ch = (bodyBottom - top - H * 0.02) / t.rows
  const col = i % t.cols
  const row = Math.floor(i / t.cols)
  return {
    x: x + col * cw + cw * 0.28,
    y: top + H * 0.02 + row * ch + ch * 0.28,
    w: cw * 0.44,
    h: ch * 0.42,
  }
}

/* ---------------------------------------------------------------------------------------------- */
/* Static layers                                                                                   */
/* ---------------------------------------------------------------------------------------------- */

function drawTower(
  ctx: CanvasRenderingContext2D,
  t: Tower,
  H: number,
  p: Palette,
  random: () => number,
) {
  const fill = p.layers[t.layer]
  const x = t.x * H
  const w = t.w * H
  const top = topOf(t) * H
  const bottom = GROUND * H + 2
  ctx.fillStyle = fill
  ctx.fillRect(x, top, w, bottom - top)

  // Crowns and rooftop clutter.
  switch (t.crown) {
    case 'step':
      ctx.fillRect(x + w * 0.18, top - H * 0.05, w * 0.64, H * 0.05 + 1)
      ctx.fillRect(x + w * 0.34, top - H * 0.08, w * 0.32, H * 0.03 + 1)
      break
    case 'spire':
      ctx.beginPath()
      ctx.moveTo(x + w * 0.42, top)
      ctx.lineTo(x + w * 0.5, top - H * 0.12)
      ctx.lineTo(x + w * 0.58, top)
      ctx.fill()
      break
    case 'slant':
      ctx.beginPath()
      ctx.moveTo(x, top)
      ctx.lineTo(x + w, top - H * 0.06)
      ctx.lineTo(x + w, top + 1)
      ctx.fill()
      break
    case 'mast':
      ctx.fillRect(x + w * 0.5 - 1, top - H * 0.1, 2, H * 0.1)
      for (let k = 1; k <= 3; k++)
        ctx.fillRect(x + w * 0.5 - H * 0.008 * k, top - H * 0.025 * k, H * 0.016 * k, 1)
      break
    default:
      ctx.fillRect(x + w * 0.15, top - H * 0.018, w * 0.18, H * 0.018 + 1)
      ctx.fillRect(x + w * 0.6, top - H * 0.028, w * 0.12, H * 0.028 + 1)
  }

  // A lit edge on near buildings gives them a side and a little depth.
  if (t.layer > 0) {
    ctx.fillStyle = p.edge
    ctx.globalAlpha = p.night ? 0.35 : 0.5
    ctx.fillRect(x, top, 1, bottom - top)
    ctx.fillRect(x, top, w, 1)
    ctx.globalAlpha = 1
  }

  // Windows: at night the lit ones; by day, glass that is darker than the wall.
  const litSet = new Set(t.lit)
  for (let i = 0; i < t.cols * t.rows; i++) {
    const r = windowRect(t, i, H)
    const lit = litSet.has(i)
    if (p.night) {
      ctx.fillStyle = p.window
      ctx.globalAlpha = lit
        ? p.windowAlpha * (0.35 + random() * 0.65) * (t.layer === 0 ? 0.5 : 1)
        : t.layer === 0
          ? 0
          : 0.035
    } else {
      ctx.fillStyle = p.window
      ctx.globalAlpha = t.layer === 0 ? 0.12 : lit ? 0.12 : p.windowAlpha
    }
    if (ctx.globalAlpha > 0) ctx.fillRect(r.x, r.y, Math.max(1, r.w), Math.max(1, r.h))
  }
  ctx.globalAlpha = 1
}

function drawSign(
  ctx: CanvasRenderingContext2D,
  text: string,
  vertical: boolean,
  cx: number,
  y: number,
  H: number,
  p: Palette,
) {
  const size = Math.max(8, H * 0.028)
  ctx.font = `600 ${size}px ${MONO}`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  const chars = vertical ? Array.from(text) : [text]
  const step = size * 1.08
  const bw = vertical ? size * 1.5 : ctx.measureText(text).width + size * 1.1
  const bh = vertical ? chars.length * step + size * 0.7 : size * 1.65
  // By day the tubes are off and the sign reads as paint on a light board.
  ctx.fillStyle = p.night ? mix(p.shop, '#000000', 0.4) : p.sky
  ctx.strokeStyle = p.tubeLit ? alpha(p.tube, 0.8) : p.edge
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.roundRect(cx - bw / 2, y, bw, bh, 2)
  ctx.fill()
  ctx.stroke()
  ctx.fillStyle = p.tube
  if (p.tubeLit) {
    ctx.shadowColor = p.tube
    ctx.shadowBlur = size * 0.8
  }
  chars.forEach((ch, i) =>
    ctx.fillText(ch, cx, vertical ? y + size * 0.35 + step * (i + 0.5) : y + bh / 2),
  )
  ctx.shadowBlur = 0
}

/** Door and badge-reader geometry of an access-controlled front, in px. */
function readerOf(front: Extract<Storefront, { kind: 'access' }>, H: number) {
  const doorW = front.door * H
  const doorX = front.x * H - doorW / 2
  const size = Math.max(5, H * 0.014)
  return {
    doorX,
    doorW,
    size,
    x: doorX + doorW + size * 1.4,
    y: (GROUND - SHOP_H * 0.42) * H,
  }
}

function renderStatic(city: City, w: number, H: number, dpr: number, p: Palette) {
  const { c, ctx } = layer(w, H, dpr)
  if (!ctx) return c
  const random = createRandom(23)

  // Sky: the page's own background at the top, so the city rises out of the page.
  const sky = ctx.createLinearGradient(0, 0, 0, GROUND * H)
  sky.addColorStop(0, p.sky)
  sky.addColorStop(0.55, p.sky)
  sky.addColorStop(1, p.haze)
  ctx.fillStyle = sky
  ctx.fillRect(0, 0, w, H)

  const hazeBand = (strength: number) => {
    const g = ctx.createLinearGradient(0, H * 0.25, 0, GROUND * H)
    g.addColorStop(0, alpha(p.haze, 0))
    g.addColorStop(1, alpha(p.haze, strength))
    ctx.fillStyle = g
    ctx.fillRect(0, H * 0.25, w, GROUND * H - H * 0.25)
  }

  // Three depths with atmospheric haze between them.
  for (const t of city.towers) if (t.layer === 0) drawTower(ctx, t, H, p, random)
  hazeBand(0.55)
  for (const t of city.towers) if (t.layer === 1) drawTower(ctx, t, H, p, random)
  hazeBand(0.3)

  // Cables (behind the near buildings' faces, between their roofs).
  ctx.strokeStyle = alpha(p.inkFaint, p.night ? 0.45 : 0.6)
  ctx.lineWidth = 1
  for (const cable of city.cables) {
    ctx.beginPath()
    for (let s = 0; s <= 1.0001; s += 0.05) {
      const pt = cablePoint(cable, s)
      if (s === 0) ctx.moveTo(pt.x * H, pt.y * H)
      else ctx.lineTo(pt.x * H, pt.y * H)
    }
    ctx.stroke()
  }

  const near = city.towers.filter((t) => t.layer === 2)
  for (const t of near) drawTower(ctx, t, H, p, random)

  // Ground floors: watched street assets (lit glass and a sign) alternate with access-controlled
  // fronts (dark glass, a door and a badge reader whose LED is drawn live).
  for (const front of city.storefronts) {
    const t = city.towers[front.tower]
    if (!t) continue
    const x = t.x * H
    const tw = t.w * H
    const top = (GROUND - SHOP_H) * H
    const glassY = top + SHOP_H * H * 0.42
    const glassH = SHOP_H * H * 0.5
    ctx.fillStyle = p.shop
    ctx.fillRect(x, top, tw, SHOP_H * H)
    ctx.fillStyle = p.edge
    ctx.fillRect(x, top, tw, 1)
    if (front.kind === 'asset') {
      ctx.fillStyle = p.shopGlow
      ctx.fillRect(x + tw * 0.06, glassY, tw * 0.88, glassH)
      if (front.asset !== 'CCTV')
        drawSign(ctx, front.asset, front.vertical, front.x * H, top + SHOP_H * H * 0.08, H, p)
    } else {
      // Tinted glass with two soft diagonal reflections, mullions and a door.
      const gx = x + tw * 0.06
      const gw = tw * 0.88
      const gy = top + SHOP_H * H * 0.28
      const gh = GROUND * H - gy
      ctx.fillStyle = p.night ? mix(p.shop, '#000000', 0.55) : mix(p.shop, p.ink, 0.18)
      ctx.fillRect(gx, gy, gw, gh)
      ctx.save()
      ctx.beginPath()
      ctx.rect(gx, gy, gw, gh)
      ctx.clip()
      ctx.fillStyle = alpha(p.ink, p.night ? 0.05 : 0.08)
      for (const off of [0.18, 0.62]) {
        ctx.beginPath()
        ctx.moveTo(gx + gw * off, gy + gh)
        ctx.lineTo(gx + gw * off + gh * 0.6, gy)
        ctx.lineTo(gx + gw * off + gh * 0.6 + gw * 0.06, gy)
        ctx.lineTo(gx + gw * off + gw * 0.06, gy + gh)
        ctx.fill()
      }
      ctx.restore()
      ctx.fillStyle = p.edge
      for (let m = 1; m < 4; m++) ctx.fillRect(gx + (gw * m) / 4, gy, 1, gh)
      const door = readerOf(front, H)
      ctx.strokeStyle = p.edge
      ctx.lineWidth = 1
      ctx.strokeRect(door.doorX + 0.5, gy + 0.5, door.doorW, gh)
      // Reader housing; its LED is drawn per frame.
      ctx.fillStyle = p.night ? mix(p.sky, '#000000', 0.4) : mix(p.ink, p.sky, 0.25)
      ctx.fillRect(door.x - door.size / 2, door.y - door.size, door.size, door.size * 1.6)
    }
  }

  // Housings for the ticker and the vertical screens (their text is drawn live).
  const led = p.night ? mix(p.sky, '#000000', 0.6) : mix(p.ink, p.sky, 0.08)
  if (city.ticker) {
    const t = city.ticker
    ctx.fillStyle = led
    ctx.fillRect(t.x * H, t.y * H, t.w * H, t.h * H)
    ctx.fillStyle = p.edge
    ctx.fillRect(t.x * H, t.y * H, t.w * H, 1)
    ctx.fillRect(t.x * H, (t.y + t.h) * H - 1, t.w * H, 1)
  }
  for (const panel of city.panels) {
    ctx.fillStyle = led
    ctx.fillRect(panel.x * H, panel.y * H, panel.w * H, panel.h * H)
  }

  // The street, and at night its wet reflection of everything lit above it.
  const ground = GROUND * H
  if (p.night) {
    const { c: copy, ctx: cctx } = layer(w, H, dpr)
    if (cctx) {
      cctx.setTransform(1, 0, 0, 1, 0, 0)
      cctx.drawImage(c, 0, 0)
      ctx.fillStyle = p.street
      ctx.fillRect(0, ground, w, H - ground)
      ctx.save()
      ctx.globalAlpha = 0.28
      ctx.translate(0, ground * 2)
      ctx.scale(1, -1)
      ctx.drawImage(copy, 0, 0, copy.width, copy.height, 0, 0, w, H)
      ctx.restore()
    }
    const fade = ctx.createLinearGradient(0, ground, 0, H)
    fade.addColorStop(0, alpha(p.street, 0.35))
    fade.addColorStop(1, alpha(p.street, 0.95))
    ctx.fillStyle = fade
    ctx.fillRect(0, ground, w, H - ground)
  } else {
    ctx.fillStyle = p.street
    ctx.fillRect(0, ground, w, H - ground)
  }
  ctx.fillStyle = p.edge
  ctx.fillRect(0, ground, w, 1)
  return c
}

/** A soft fog bank, twice the width of the street so it can drift and wrap. */
function renderFog(w: number, H: number, dpr: number, p: Palette) {
  const { c, ctx } = layer(w * 2, H, dpr)
  if (!ctx) return c
  const random = createRandom(31)
  for (let i = 0; i < Math.max(6, (w / H) * 5); i++) {
    const x = random() * w * 2
    const y = H * (0.45 + random() * 0.3)
    const r = H * (0.25 + random() * 0.3)
    const g = ctx.createRadialGradient(x, y, 0, x, y, r)
    g.addColorStop(0, alpha(p.haze, p.night ? 0.28 : 0.4))
    g.addColorStop(1, alpha(p.haze, 0))
    ctx.fillStyle = g
    ctx.save()
    ctx.translate(x, y)
    ctx.scale(2.6, 0.45)
    ctx.translate(-x, -y)
    ctx.fillRect(x - r, y - r, r * 2, r * 2)
    ctx.restore()
  }
  return c
}

/** The advisory ticker's text as one long strip, repeated so it scrolls seamlessly. */
function renderTicker(h: number, dpr: number, p: Palette) {
  const size = Math.max(8, h * 0.62)
  const font = `600 ${size}px ${MONO}`
  const probe = document.createElement('canvas').getContext('2d')
  if (!probe) return null
  probe.font = font
  const sep = '   ▲   '
  const pieces = ADVISORIES.map((a) => ({ ...a, width: probe.measureText(a.text + sep).width }))
  const width = pieces.reduce((s, x) => s + x.width, 0)
  const { c, ctx } = layer(width, h, dpr)
  if (!ctx) return null
  ctx.font = font
  ctx.textBaseline = 'middle'
  const text = p.night ? p.ink : p.sky
  let x = 0
  for (const piece of pieces) {
    ctx.fillStyle = piece.sev ? (p.night ? p[piece.sev] : mix(p[piece.sev], '#ffffff', 0.35)) : text
    if (p.night) {
      ctx.shadowColor = ctx.fillStyle
      ctx.shadowBlur = size * 0.5
    }
    ctx.fillText(piece.text, x, h / 2)
    ctx.shadowBlur = 0
    ctx.fillStyle = alpha(text, 0.5)
    ctx.fillText(sep, x + probe.measureText(piece.text).width, h / 2)
    x += piece.width
  }
  return { c, width }
}

/* ---------------------------------------------------------------------------------------------- */
/* Component                                                                                       */
/* ---------------------------------------------------------------------------------------------- */

type TowerJob =
  | {
      kind: 'patch'
      tower: number
      start: number
      dur: number
      fixed: number
      flashes: { i: number; at: number; sev: Severity }[]
    }
  | {
      kind: 'cve'
      tower: number
      start: number
      dur: number
      label: string
      sev: Severity
      windows: number[]
    }

type SiteEvent = {
  front: number
  start: number
  resolveAt: number
  end: number
  first: [string, string]
  then: [string, string]
  sev: Severity
}

type Profile = {
  walker: number
  start: number
  resolveAt: number
  end: number
  first: [string, string]
  then?: [string, string]
  sev?: Severity
}

export default function CityWatch() {
  const wrapRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const wrap = wrapRef.current
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!wrap || !canvas || !ctx) return

    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
    const random = createRandom(97)

    let W = 0
    let H = 0
    let dpr = 1
    let city: City | null = null
    let p: Palette = paletteFor(getTheme(), readTokens())
    let staticLayer: HTMLCanvasElement | null = null
    let fog: HTMLCanvasElement | null = null
    let ticker: { c: HTMLCanvasElement; width: number } | null = null
    let walkers: Walker[] = []
    let rain: { x: number; y: number; len: number; speed: number }[] = []
    /** Vulnerable windows per tower index: severity and when it appeared. Survives theme switches. */
    let vulns = new Map<number, Map<number, { sev: Severity; since: number }>>()
    /** Events on ground-floor assets and badge readers. */
    let siteEvents: SiteEvent[] = []
    let nextSite = 0
    let jobs: TowerJob[] = []
    let profiles: Profile[] = []
    let nextJob = 0
    let nextProfile = 0
    let patched = 388
    let frame = 0
    let last = 0
    let visible = false
    let disposed = false

    const watched = () =>
      city ? city.towers.map((t, i) => ({ t, i })).filter(({ t }) => t.layer > 0) : []

    const seedVulns = () => {
      vulns = new Map()
      for (const { t, i } of watched()) {
        const n = Math.floor(random() * 3)
        const set = new Map<number, { sev: Severity; since: number }>()
        for (let k = 0; k < n; k++)
          set.set(Math.floor(random() * t.cols * t.rows), {
            sev: random() < 0.3 ? 'high' : 'medium',
            since: -1e6,
          })
        if (set.size) vulns.set(i, set)
      }
    }

    const rebuild = () => {
      const rect = wrap.getBoundingClientRect()
      if (rect.width < 10 || rect.height < 10) return
      const sizeChanged = rect.width !== W || rect.height !== H
      W = rect.width
      H = rect.height
      dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = Math.round(W * dpr)
      canvas.height = Math.round(H * dpr)
      const theme = getTheme()
      p = paletteFor(theme, readTokens())
      wrap.dataset.scene = theme === 'dark' ? 'night' : 'day'
      if (sizeChanged || !city) {
        city = buildCity(W / H)
        seedVulns()
        jobs = []
        profiles = []
        siteEvents = []
      }
      staticLayer = renderStatic(city, W, H, dpr, p)
      fog = renderFog(W, H, dpr, p)
      ticker = city.ticker ? renderTicker(city.ticker.h * H, dpr, p) : null
      // Umbrellas only in the rain, which only falls at night.
      walkers = buildWalkers(Math.round(Math.min(60, Math.max(10, W / 38)))).map((w) =>
        p.night ? w : { ...w, umbrella: false },
      )
      rain = p.night
        ? Array.from({ length: Math.round((W * H) / 2600) }, () => ({
            x: random() * W,
            y: random() * H,
            len: H * (0.02 + random() * 0.025),
            speed: H * (1.6 + random() * 0.8),
          }))
        : []
      draw(reduce ? 7300 : performance.now(), 0)
    }

    const vulnerableCount = () => [...vulns.values()].reduce((s, m) => s + m.size, 0)

    /** Schedule the next thing the SOC does to the city. */
    const scheduleJob = (t: number) => {
      if (!city || jobs.length >= 2) return
      const busy = new Set(jobs.map((j) => j.tower))
      const onScreen = watched().filter(
        ({ t: tw, i }) => !busy.has(i) && tw.x * H > 40 && (tw.x + tw.w) * H < W - 40,
      )
      if (!onScreen.length) return
      const withVulns = onScreen.filter(({ i }) => (vulns.get(i)?.size ?? 0) > 0)
      if (withVulns.length && (vulnerableCount() > 5 || random() < 0.55)) {
        const pick = withVulns.sort(
          (a, b) => (vulns.get(b.i)?.size ?? 0) - (vulns.get(a.i)?.size ?? 0),
        )[0]
        if (pick)
          jobs.push({ kind: 'patch', tower: pick.i, start: t, dur: 2600, fixed: 0, flashes: [] })
      } else {
        const pick = onScreen[Math.floor(random() * onScreen.length)]
        if (!pick) return
        const sev: Severity = random() < 0.2 ? 'critical' : random() < 0.5 ? 'high' : 'medium'
        const score =
          sev === 'critical'
            ? 9 + random() * 0.9
            : sev === 'high'
              ? 7 + random() * 1.9
              : 4 + random() * 2.9
        const windows = Array.from({ length: 1 + Math.floor(random() * 3) }, () =>
          Math.floor(random() * pick.t.cols * pick.t.rows),
        )
        jobs.push({
          kind: 'cve',
          tower: pick.i,
          start: t,
          dur: 2600,
          sev,
          windows,
          label: `CVE-2026-${(1000 + Math.floor(random() * 38000)).toString()} · CVSS ${score.toFixed(1)}`,
        })
      }
    }

    const draw = (t: number, dt: number) => {
      if (!city || !staticLayer) return
      const L = city
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.drawImage(staticLayer, 0, 0)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      const fontSize = Math.max(9, H * 0.024)
      const font = `600 ${fontSize}px ${MONO}`

      // Fog drifting between the towers.
      if (fog) {
        const off = reduce ? 0 : (((t * 0.008 * (H / 400)) % W) + W) % W
        ctx.drawImage(fog, 0, 0, fog.width, fog.height, -off, 0, W * 2, H)
        if (off > W) ctx.drawImage(fog, 0, 0, fog.width, fog.height, W * 2 - off, 0, W * 2, H)
      }

      // Aviation lights on masts and spires.
      if (p.night) {
        ctx.fillStyle = p.ink
        ctx.globalAlpha = reduce ? 0.8 : ease(0.5 + 0.5 * Math.sin(t / 520))
        for (const tw of L.towers) {
          if (tw.crown !== 'mast' && tw.crown !== 'spire') continue
          const peak = topOf(tw) * H - (tw.crown === 'mast' ? 0.1 : 0.12) * H
          ctx.fillRect(tw.x * H + (tw.w * H) / 2 - 1, peak - 2, 2, 2)
        }
        ctx.globalAlpha = 1
      }

      // SOC work on the buildings.
      if (!reduce && t > nextJob) {
        scheduleJob(t)
        nextJob = t + 2400 + random() * 1800
      }
      if (reduce && !jobs.length) {
        const first = [...vulns.keys()][0]
        if (first !== undefined)
          jobs.push({ kind: 'patch', tower: first, start: 0, dur: Infinity, fixed: 0, flashes: [] })
      }

      // Vulnerable windows glow in their severity colour.
      const pulse = reduce ? 1 : 0.65 + 0.35 * Math.sin(t / 260)
      for (const [ti, set] of vulns) {
        const tw = L.towers[ti]
        if (!tw) continue
        for (const [wi, { sev, since }] of set) {
          const r = windowRect(tw, wi, H)
          drawWindowGlow(r, sevColor(p, sev), pulse * (reduce ? 1 : ease((t - since) / 700)))
        }
      }
      ctx.globalAlpha = 1

      ctx.font = font
      ctx.textBaseline = 'bottom'
      ctx.textAlign = 'left'
      jobs = jobs.filter((job) => t < job.start + job.dur + 1600 || reduce)
      for (const job of jobs) {
        const tw = L.towers[job.tower]
        if (!tw) continue
        const x = tw.x * H
        const w = tw.w * H
        const top = topOf(tw) * H
        const bottom = (GROUND - (tw.layer === 2 ? SHOP_H : 0)) * H
        const k = reduce ? 0.62 : ease((t - job.start) / job.dur)
        const shown = reduce ? 1 : presence(t, job.start, job.start + job.dur + 1600, 320, 700)
        if (job.kind === 'patch') {
          // A patch rolls up the building; vulnerable windows it passes flash and go dark.
          const y = bottom - (bottom - top) * k
          if (k < 1) {
            const g = ctx.createLinearGradient(0, y, 0, y + H * 0.06)
            g.addColorStop(0, alpha(p.ink, p.night ? 0.35 : 0.25))
            g.addColorStop(1, alpha(p.ink, 0))
            ctx.fillStyle = g
            ctx.fillRect(x, y, w, H * 0.06)
            ctx.fillStyle = p.ink
            ctx.fillRect(x, y, w, 1)
          }
          const set = vulns.get(job.tower)
          if (set && !reduce) {
            for (const [wi, v] of [...set.entries()]) {
              if (windowRect(tw, wi, H).y > y) {
                set.delete(wi)
                job.fixed++
                patched++
                job.flashes.push({ i: wi, at: t, sev: v.sev })
              }
            }
            if (!set.size) vulns.delete(job.tower)
          }
          // Patched windows ease from their severity colour to a clean white, then fade out
          // slowly, instead of blinking off.
          for (const f of job.flashes) {
            const age = (t - f.at) / 1600
            if (age >= 1) continue
            const r = windowRect(tw, f.i, H)
            const toWhite = ease(age / 0.3)
            const fade = 1 - ease((age - 0.3) / 0.7)
            drawWindowGlow(r, mix(sevColor(p, f.sev), p.ink, toWhite), fade)
          }
          const label =
            k < 1
              ? `${tw.host} · PATCHING ${Math.round(k * 100)}%`
              : `${tw.host} · PATCHED · ${job.fixed} CVE`
          tag(x + 4, top - H * 0.035, label, p.ink, k, shown)
        } else {
          // A new CVE pings in: rings on the affected windows, then they turn vulnerable.
          const color = sevColor(p, job.sev)
          for (const wi of job.windows) {
            const r = windowRect(tw, wi, H)
            const ring = ((t - job.start) % 900) / 900
            if (k < 1) {
              ctx.strokeStyle = alpha(color, (1 - ring) * shown)
              ctx.lineWidth = 1.5
              ctx.beginPath()
              ctx.arc(r.x + r.w / 2, r.y + r.h / 2, 3 + ring * H * 0.05, 0, Math.PI * 2)
              ctx.stroke()
            } else {
              const set =
                vulns.get(job.tower) ?? new Map<number, { sev: Severity; since: number }>()
              if (!set.has(wi)) set.set(wi, { sev: job.sev, since: t })
              vulns.set(job.tower, set)
            }
          }
          tag(x + 4, top - H * 0.035, job.label, color, 1, shown)
        }
      }

      // Packets on the rooftop cables; malicious ones are dropped at the firewall.
      for (const [ci, cable] of L.cables.entries()) {
        const fw = cablePoint(cable, cable.firewall)
        ctx.fillStyle = mix(p.sky, '#000000', p.night ? 0.5 : 0)
        ctx.strokeStyle = p.inkFaint
        ctx.lineWidth = 1
        const box = H * 0.022
        ctx.beginPath()
        ctx.roundRect(fw.x * H - box / 2, fw.y * H - box / 2, box, box, box * 0.25)
        ctx.fill()
        ctx.stroke()
        // A small shield bar across the node.
        ctx.fillStyle = alpha(p.ink, p.night ? 0.5 : 0.6)
        ctx.fillRect(fw.x * H - box * 0.25, fw.y * H - 0.5, box * 0.5, 1)
        ctx.fillStyle = p.inkFaint
        ctx.font = `600 ${fontSize * 0.75}px ${MONO}`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'top'
        ctx.fillText('FW', fw.x * H, fw.y * H + box / 2 + 2)
        ctx.textAlign = 'left'
        ctx.textBaseline = 'bottom'
        ctx.font = font
        const n = 4
        for (let k = 0; k < n; k++) {
          const s = packetAt(reduce ? 1500 : t, k, n, 5200 + ci * 700)
          const cycle = Math.floor((reduce ? 1500 : t) / (5200 + ci * 700) + k / n)
          const bad = (cycle * 7 + k * 3 + ci) % 6 === 0
          if (bad && s > cable.firewall) {
            if (s - cable.firewall < 0.08) {
              ctx.globalAlpha = reduce ? 1 : ease(1 - (s - cable.firewall) / 0.08)
              ctx.strokeStyle = p.critical
              ctx.lineWidth = 1.5
              const cx = fw.x * H
              const cy = fw.y * H - box
              ctx.beginPath()
              ctx.moveTo(cx - 4, cy - 4)
              ctx.lineTo(cx + 4, cy + 4)
              ctx.moveTo(cx + 4, cy - 4)
              ctx.lineTo(cx - 4, cy + 4)
              ctx.stroke()
              ctx.font = `600 ${fontSize * 0.85}px ${MONO}`
              ctx.fillStyle = p.critical
              ctx.fillText('DROP', cx + 7, cy + 4)
              ctx.font = font
              ctx.globalAlpha = 1
            }
            continue
          }
          // Fade in after leaving one roof and out before reaching the next.
          const edge = ease(s / 0.08) * ease((1 - s) / 0.08)
          const nearWall = bad ? 1 - ease((s - (cable.firewall - 0.05)) / 0.05) : 1
          const tone = bad ? p.critical : p.ink
          for (let k2 = 3; k2 >= 0; k2--) {
            const back = cablePoint(cable, Math.max(0, s - k2 * 0.012))
            ctx.globalAlpha = edge * nearWall * (k2 === 0 ? 0.95 : 0.22 / k2)
            ctx.fillStyle = tone
            ctx.beginPath()
            ctx.arc(back.x * H, back.y * H, k2 === 0 ? 1.7 : 1.2, 0, Math.PI * 2)
            ctx.fill()
          }
          if (p.night && k2Glow(edge * nearWall)) {
            const pt = cablePoint(cable, s)
            const g = ctx.createRadialGradient(pt.x * H, pt.y * H, 0, pt.x * H, pt.y * H, 6)
            g.addColorStop(0, alpha(tone, 0.35 * edge * nearWall))
            g.addColorStop(1, alpha(tone, 0))
            ctx.globalAlpha = 1
            ctx.fillStyle = g
            ctx.fillRect(pt.x * H - 6, pt.y * H - 6, 12, 12)
          }
          ctx.globalAlpha = 1
        }
      }

      // Advisory ticker.
      if (L.ticker && ticker) {
        const tk = L.ticker
        ctx.save()
        ctx.beginPath()
        ctx.rect(tk.x * H, tk.y * H, tk.w * H, tk.h * H)
        ctx.clip()
        const speed = H * 0.09
        const off = reduce ? 0 : ((t / 1000) * speed) % ticker.width
        for (let x = tk.x * H - off; x < (tk.x + tk.w) * H; x += ticker.width)
          ctx.drawImage(
            ticker.c,
            0,
            0,
            ticker.c.width,
            ticker.c.height,
            x,
            tk.y * H,
            ticker.width,
            tk.h * H,
          )
        ctx.restore()
      }

      // Vertical screens cycle short security words, cross-fading between them.
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      for (const [pi, panel] of L.panels.entries()) {
        const at = t / 4200 + pi * 0.6
        const cycle = reduce ? pi : Math.floor(at)
        const fade = reduce ? 1 : Math.min(ease((at % 1) / 0.14), ease((1 - (at % 1)) / 0.14))
        const word = PANEL_WORDS[(cycle + pi) % PANEL_WORDS.length] ?? 'PATCH'
        const size = Math.min(panel.w * H * 0.62, (panel.h * H) / (word.length + 1))
        ctx.font = `600 ${size}px ${MONO}`
        ctx.fillStyle = p.night ? p.ink : p.sky
        ctx.globalAlpha = fade
        if (p.night) {
          ctx.shadowColor = p.ink
          ctx.shadowBlur = size * 0.6
        }
        const cx = (panel.x + panel.w / 2) * H
        const startY = panel.y * H + (panel.h * H - word.length * size) / 2 + size / 2
        Array.from(word).forEach((ch, i) => ctx.fillText(ch, cx, startY + i * size))
        ctx.shadowBlur = 0
        ctx.globalAlpha = 1
      }
      ctx.font = font

      // Patrol drones; at night one sweeps a searchlight over the street.
      for (let d = 0; d < (W / H > 1.6 ? 2 : 1); d++) {
        const span = W + H * 0.6
        const dx =
          (((((reduce ? 9000 : t) * H * (0.00004 + d * 0.00002) + d * span * 0.5) % span) + span) %
            span) -
          H * 0.3
        const dy = H * (0.16 + d * 0.08) + Math.sin(t / 700 + d) * H * 0.006
        if (p.night && d === 0) {
          const angle = Math.sin(t / 2400) * 0.35
          const len = GROUND * H - dy + H * 0.15
          const spread = H * 0.11
          const tipX = dx + Math.sin(angle) * len
          const cone = ctx.createLinearGradient(dx, dy, tipX, dy + len)
          cone.addColorStop(0, alpha(p.ink, 0.16))
          cone.addColorStop(1, alpha(p.ink, 0))
          ctx.fillStyle = cone
          ctx.beginPath()
          ctx.moveTo(dx, dy)
          ctx.lineTo(tipX - spread, dy + len)
          ctx.lineTo(tipX + spread, dy + len)
          ctx.closePath()
          ctx.fill()
        }
        ctx.fillStyle = p.night ? mix(p.sky, p.ink, 0.25) : mix(p.ink, p.sky, 0.25)
        const s = H * 0.012
        ctx.fillRect(dx - s * 1.6, dy - s * 0.3, s * 3.2, s * 0.6)
        ctx.fillRect(dx - s * 2.2, dy - s * 0.7, s * 1.2, 1)
        ctx.fillRect(dx + s, dy - s * 0.7, s * 1.2, 1)
        ctx.fillStyle = p.night ? p.ink : p.critical
        ctx.globalAlpha = reduce ? 1 : ease(0.5 + 0.5 * Math.sin(t / 380 + d * 2))
        ctx.fillRect(dx - 1, dy + s * 0.3, 2, 2)
        ctx.globalAlpha = 1
      }

      // Ground-floor assets and badge readers: the SOC watches the street level too.
      const fronts = L.storefronts
      if (!reduce && t > nextSite && siteEvents.length < 1) {
        const free = fronts
          .map((f, i) => ({ f, i }))
          .filter(({ f }) => f.x * H > W * 0.08 && f.x * H < W * 0.85)
        const pick = free[Math.floor(random() * free.length)]
        if (pick) {
          const ev =
            pick.f.kind === 'asset'
              ? ASSET_EVENTS[pick.f.asset]
              : ACCESS_EVENTS[Math.floor(random() * ACCESS_EVENTS.length)]
          if (ev)
            siteEvents.push({ front: pick.i, start: t, resolveAt: t + 2200, end: t + 4600, ...ev })
        }
        nextSite = t + 3800 + random() * 2600
      }
      if (reduce && !siteEvents.length) {
        const i = fronts.findIndex((f) => f.kind === 'asset' && f.x * H > W * 0.3)
        const f = fronts[i]
        if (f?.kind === 'asset')
          siteEvents.push({
            front: i,
            start: -1,
            resolveAt: -1,
            end: Infinity,
            ...ASSET_EVENTS[f.asset],
          })
      }
      siteEvents = siteEvents.filter((ev) => ev.end > t)
      for (const [i, f] of fronts.entries()) {
        if (f.kind !== 'access') continue
        const r = readerOf(f, H)
        const ev = siteEvents.find((e) => e.front === i)
        // Idle: a steady dim light. Alert: a slow amber breath. Resolved: eases back to idle.
        const alert = ev && t < ev.resolveAt ? presence(t, ev.start, ev.resolveAt, 300, 500) : 0
        ctx.fillStyle = p.night ? alpha(p.ink, 0.55) : p.inkFaint
        ctx.fillRect(r.x - 1.5, r.y - r.size * 0.6, 3, 3)
        if (alert > 0 && ev) {
          ctx.globalAlpha = alert * (0.55 + 0.45 * Math.sin(t / 220))
          ctx.fillStyle = sevColor(p, ev.sev)
          if (p.night) {
            ctx.shadowColor = ctx.fillStyle
            ctx.shadowBlur = H * 0.02
          }
          ctx.fillRect(r.x - 2, r.y - r.size * 0.6 - 0.5, 4, 4)
          ctx.shadowBlur = 0
          ctx.globalAlpha = 1
        }
      }

      for (const cam of L.cameras) {
        const ev = siteEvents.find((e) => e.front === cam.front)
        const f = fronts[cam.front]
        const alert =
          ev && f?.kind === 'asset'
            ? { color: sevColor(p, ev.sev), k: presence(t, ev.start, ev.resolveAt, 300, 500) }
            : null
        drawCamera(cam, t, alert)
      }
      for (const f of fronts) {
        if (f.kind !== 'asset' || f.asset !== 'FREE WI-FI') continue
        drawWifi(f.x * H, (GROUND - SHOP_H) * H + SHOP_H * H * 0.08 - H * 0.012, t)
      }

      // People: far rows first, their reflections in the wet street at night.
      const positions = new Map<number, { x: number; feet: number; size: number }>()
      const order = walkers.map((w, i) => ({ w, i })).sort((a, b) => a.w.row - b.w.row)
      const glow = p.night ? p.ink : null
      for (const { w, i } of order) {
        const time = reduce ? 0 : t
        const size = ROW_HEIGHT[w.row] * w.height * H
        const x = walkerX(w, time, W, H)
        const feet = ROW_FEET[w.row] * H
        const phase = gait(w, time)
        positions.set(i, { x, feet, size })
        if (x < -size || x > W + size) continue
        const tone = w.row === 0 ? mix(p.person, p.haze, p.night ? 0.25 : 0.35) : p.person
        if (p.night && w.row < 2) {
          ctx.save()
          ctx.globalAlpha = 0.14
          ctx.translate(0, feet * 2)
          ctx.scale(1, -1)
          drawFigure(ctx, w, x, feet, size, phase, p.rim, null)
          ctx.restore()
        }
        if (p.night) {
          // Rim light from the shopfronts behind them.
          ctx.globalAlpha = 0.5
          drawFigure(ctx, w, x, feet - 1, size, phase, p.rim, null)
          ctx.globalAlpha = 1
        }
        drawFigure(ctx, w, x, feet, size, phase, tone, glow)
      }

      // Rain.
      if (rain.length) {
        ctx.strokeStyle = alpha(p.ink, 0.22)
        ctx.lineWidth = 1
        ctx.beginPath()
        for (const d of rain) {
          if (dt) {
            d.y += (d.speed * dt) / 1000
            d.x -= (d.speed * 0.12 * dt) / 1000
            if (d.y > H) {
              d.y = -d.len
              d.x = random() * (W + H * 0.2)
            }
          }
          ctx.moveTo(d.x, d.y)
          ctx.lineTo(d.x - d.len * 0.12, d.y + d.len)
        }
        ctx.stroke()
      }

      // The profiler: checks a passer-by's devices, then shows how it was resolved.
      if (!reduce && t > nextProfile && profiles.length < 2) {
        const taken = profiles.map((pr) => positions.get(pr.walker)?.x ?? -1e5)
        const candidates = [...positions.entries()].filter(
          ([i, pos]) =>
            (walkers[i]?.row ?? 0) > 0 &&
            pos.x > W * 0.06 &&
            pos.x < W * 0.8 &&
            taken.every((x) => Math.abs(x - pos.x) > H * 0.9),
        )
        const pick = candidates[Math.floor(random() * candidates.length)]
        const profile = PROFILES[Math.floor(random() * PROFILES.length)]
        if (pick && profile) {
          profiles.push({
            walker: pick[0],
            start: t,
            resolveAt: t + 1900,
            end: t + 4200,
            first: profile.first,
            ...(profile.then ? { then: profile.then } : {}),
            ...(profile.sev ? { sev: profile.sev } : {}),
          })
        }
        nextProfile = t + 1300 + random() * 1300
      }
      if (reduce && !profiles.length) {
        const near = [...positions.entries()].find(
          ([i, pos]) => walkers[i]?.row === 2 && pos.x > W * 0.2 && pos.x < W * 0.7,
        )
        const profile = PROFILES[4]
        if (near && profile?.then)
          profiles.push({
            walker: near[0],
            start: 0,
            resolveAt: 0,
            end: Infinity,
            first: profile.first,
            then: profile.then,
          })
      }
      profiles = profiles.filter((pr) => pr.end > t)
      for (const pr of profiles) {
        const pos = positions.get(pr.walker)
        if (!pos) continue
        // Eased in and out; a flagged finding cross-fades to its resolution.
        const shown = reduce ? 1 : presence(t, pr.start, pr.end, 300, 650)
        const toThen = pr.then ? (reduce ? 1 : ease((t - pr.resolveAt) / 450)) : 0
        const sevTone = pr.sev ? sevColor(p, pr.sev) : p.ink
        const color = mix(sevTone, p.ink, toThen)
        const grow = reduce ? 1 : ease((t - pr.start) / 380)
        const bw = pos.size * 0.42
        const bh = pos.size * 1.06
        const bx = pos.x - bw / 2
        const by = pos.feet - bh
        const k = Math.min(9, bw * 0.28) * grow
        ctx.globalAlpha = shown
        ctx.strokeStyle = color
        ctx.lineWidth = 1.25
        ctx.beginPath()
        for (const [cx, cy, sx, sy] of [
          [bx, by, 1, 1],
          [bx + bw, by, -1, 1],
          [bx, by + bh, 1, -1],
          [bx + bw, by + bh, -1, -1],
        ] as const) {
          ctx.moveTo(cx + sx * k, cy)
          ctx.lineTo(cx, cy)
          ctx.lineTo(cx, cy + sy * k)
        }
        // Leader line up to the card, which flips to the left near the right edge.
        ctx.font = font
        const all = [...pr.first, ...(pr.then ?? [])]
        const tw = Math.max(...all.map((l) => ctx.measureText(l).width))
        const cardW = tw + 12
        const right = bx + bw + H * 0.03 + cardW < W - 4
        const anchorX = right ? bx + bw : bx
        const lx = right ? bx + bw + H * 0.03 : Math.max(4, bx - H * 0.03 - cardW)
        const ly = by - H * 0.04
        ctx.moveTo(anchorX, by)
        ctx.lineTo(right ? lx : lx + cardW, ly)
        ctx.stroke()
        const lh = fontSize * 1.25
        ctx.fillStyle = alpha(p.sky, 0.84)
        ctx.fillRect(lx, ly - lh * 2 - 4, cardW, lh * 2 + 6)
        ctx.fillStyle = color
        ctx.fillRect(lx, ly - lh * 2 - 4, 2, lh * 2 + 6)
        ctx.textAlign = 'left'
        ctx.textBaseline = 'bottom'
        for (const [lines, weight, resolved] of [
          [pr.first, 1 - toThen, false],
          [pr.then ?? pr.first, toThen, true],
        ] as const) {
          if (weight <= 0) continue
          ctx.globalAlpha = shown * weight
          const tone = resolved || !pr.sev ? p.ink : sevTone
          ctx.fillStyle = tone
          ctx.fillText(lines[0], lx + 8, ly - lh - 1)
          ctx.fillStyle = resolved || !pr.sev ? p.inkSoft : sevTone
          ctx.fillText(lines[1], lx + 8, ly)
        }
        ctx.globalAlpha = 1
      }

      // Cards for the street-level events, fading in, cross-fading to the resolution, fading out.
      for (const ev of siteEvents) {
        const f = fronts[ev.front]
        if (!f) continue
        const shown = reduce ? 1 : presence(t, ev.start, ev.end, 360, 600)
        const toThen = reduce ? 1 : ease((t - ev.resolveAt) / 450)
        const cam = L.cameras.find((c) => c.front === ev.front)
        const anchorX =
          f.kind === 'access' ? readerOf(f, H).x : f.asset === 'CCTV' && cam ? cam.x * H : f.x * H
        const anchorY = (GROUND - SHOP_H) * H + SHOP_H * H * 0.08
        card(anchorX, anchorY - H * 0.012, ev.first, ev.then, ev.sev, shown, toThen)
      }

      // HUD, top left: the SOC's view of the district (stacked on narrow screens).
      ctx.font = font
      ctx.textAlign = 'left'
      ctx.textBaseline = 'top'
      const pad = Math.max(12, H * 0.04)
      ctx.fillStyle = p.inkSoft
      ctx.fillText('CITY WATCH · SECTOR 07', pad, pad)
      ctx.fillStyle = p.inkFaint
      const stats = [
        'ENDPOINTS 1,284',
        `VULNERABLE ${17 + vulnerableCount()}`,
        `PATCHED ${patched}`,
      ]
      const oneLine = stats.join(' · ')
      if (ctx.measureText(oneLine).width < W * 0.6) {
        ctx.fillText(oneLine, pad, pad + fontSize * 1.4)
      } else {
        ctx.fillText(`${stats[0]} · ${stats[1]}`, pad, pad + fontSize * 1.4)
        ctx.fillText(stats[2] ?? '', pad, pad + fontSize * 2.8)
      }

      if (wrap.dataset.profiles !== String(profiles.length))
        wrap.dataset.profiles = String(profiles.length)
    }

    /**
     * A two-line status card with a severity stripe. `shown` fades it in and out; `toThen`
     * cross-fades from the finding to its resolution (and the stripe from severity to neutral).
     */
    const card = (
      ax: number,
      ay: number,
      first: [string, string],
      then: [string, string],
      sev: Severity,
      shown: number,
      toThen: number,
    ) => {
      if (shown <= 0) return
      const fs = Math.max(9, H * 0.024)
      ctx.font = `600 ${fs}px ${MONO}`
      const tw = Math.max(...[...first, ...then].map((l) => ctx.measureText(l).width))
      const cw = tw + 14
      const lh = fs * 1.25
      const ch = lh * 2 + 6
      const x = Math.max(4, Math.min(ax - cw / 2, W - cw - 4))
      const y = ay - ch
      ctx.globalAlpha = shown
      ctx.fillStyle = alpha(p.sky, 0.86)
      ctx.fillRect(x, y, cw, ch)
      ctx.fillStyle = mix(sevColor(p, sev), p.ink, toThen)
      ctx.fillRect(x, y, 2, ch)
      ctx.textAlign = 'left'
      ctx.textBaseline = 'bottom'
      for (const [lines, a, resolved] of [
        [first, 1 - toThen, false],
        [then, toThen, true],
      ] as const) {
        if (a <= 0) continue
        ctx.globalAlpha = shown * a
        ctx.fillStyle = resolved ? p.ink : sevColor(p, sev)
        ctx.fillText(lines[0], x + 9, y + lh + 2)
        ctx.fillStyle = resolved ? p.inkSoft : sevColor(p, sev)
        ctx.fillText(lines[1], x + 9, y + lh * 2 + 2)
      }
      ctx.globalAlpha = 1
    }

    /** A lit window: rounded, with a soft halo at night. */
    const drawWindowGlow = (
      r: { x: number; y: number; w: number; h: number },
      color: string,
      strength: number,
    ) => {
      if (strength <= 0) return
      const w = Math.max(2.5, r.w)
      const h = Math.max(2.5, r.h)
      const cx = r.x + w / 2
      const cy = r.y + h / 2
      if (p.night) {
        const rad = Math.max(w, h) * 2.2
        const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, rad)
        g.addColorStop(0, alpha(color, 0.4 * strength))
        g.addColorStop(1, alpha(color, 0))
        ctx.fillStyle = g
        ctx.fillRect(cx - rad, cy - rad, rad * 2, rad * 2)
      }
      ctx.globalAlpha = strength
      ctx.fillStyle = color
      ctx.beginPath()
      ctx.roundRect(r.x, r.y, w, h, Math.min(w, h) * 0.3)
      ctx.fill()
      ctx.globalAlpha = 1
    }
    const k2Glow = (v: number) => v > 0.02

    /**
     * A wall-mounted camera: bracket, housing with a sunshade, lens and a status LED. It pans
     * slowly; the LED breathes, and turns to the alert colour while its CCTV event is open.
     */
    const drawCamera = (cam: Camera, t: number, alert: { color: string; k: number } | null) => {
      const u = H * 0.03 * cam.size
      const x = cam.x * H
      const y = cam.y * H
      const body = p.night ? mix(p.sky, p.ink, 0.22) : mix(p.ink, p.sky, 0.3)
      // Bracket from the wall.
      ctx.strokeStyle = body
      ctx.lineWidth = Math.max(1, u * 0.12)
      ctx.beginPath()
      ctx.moveTo(x, y - u * 0.35)
      ctx.lineTo(x, y)
      ctx.lineTo(x + cam.dir * u * 0.35, y)
      ctx.stroke()
      // Housing, tilted down and panning.
      const pan = reduce ? 0 : Math.sin(t / 2800 + cam.phase) * 0.22
      const angle = cam.dir * (0.32 + pan)
      ctx.save()
      ctx.translate(x + cam.dir * u * 0.35, y)
      ctx.rotate(angle)
      ctx.scale(cam.dir, 1)
      ctx.fillStyle = body
      ctx.beginPath()
      ctx.roundRect(-u * 0.15, -u * 0.22, u * 1.05, u * 0.44, u * 0.12)
      ctx.fill()
      // Sunshade lip over the top.
      ctx.fillRect(-u * 0.05, -u * 0.32, u * 1.2, u * 0.1)
      if (p.night) {
        ctx.fillStyle = alpha(p.ink, 0.35)
        ctx.fillRect(-u * 0.05, -u * 0.32, u * 1.2, 1)
      }
      // Lens.
      ctx.fillStyle = p.night ? mix(p.sky, '#000000', 0.7) : p.ink
      ctx.beginPath()
      ctx.arc(u * 0.9, 0, u * 0.15, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = alpha(p.ink, p.night ? 0.7 : 0.4)
      ctx.fillRect(u * 0.93, -u * 0.06, 1, 1)
      // Status LED near the back.
      const breathe = reduce ? 0.7 : 0.45 + 0.35 * (0.5 + 0.5 * Math.sin(t / 900 + cam.phase))
      ctx.fillStyle = alert ? mix(p.inkSoft, alert.color, alert.k) : p.inkSoft
      ctx.globalAlpha = alert ? Math.max(breathe, alert.k) : breathe
      ctx.beginPath()
      ctx.arc(u * 0.1, 0, Math.max(0.9, u * 0.06), 0, Math.PI * 2)
      ctx.fill()
      ctx.globalAlpha = 1
      ctx.restore()
    }

    /** A Wi-Fi access point above its sign, sending out soft rings. */
    const drawWifi = (cx: number, cy: number, t: number) => {
      const u = H * 0.012
      ctx.fillStyle = p.night ? mix(p.sky, p.ink, 0.25) : mix(p.ink, p.sky, 0.3)
      ctx.beginPath()
      ctx.roundRect(cx - u, cy - u * 0.45, u * 2, u * 0.9, u * 0.3)
      ctx.fill()
      ctx.strokeStyle = p.night ? p.ink : p.inkSoft
      ctx.lineWidth = 1
      for (let ring = 0; ring < 3; ring++) {
        const k = reduce ? (ring + 1) / 4 : (t / 2200 + ring / 3) % 1
        const a = Math.sin(Math.PI * k) * (p.night ? 0.55 : 0.45)
        ctx.globalAlpha = a
        ctx.beginPath()
        ctx.arc(cx, cy - u * 0.4, u * (1.1 + k * 2.6), Math.PI * 1.2, Math.PI * 1.8)
        ctx.stroke()
      }
      ctx.globalAlpha = 1
    }

    /** A small mono label with a tick under it, used above buildings. */
    const tag = (at: number, y: number, text: string, color: string, k: number, shown = 1) => {
      if (shown <= 0) return
      ctx.globalAlpha = shown
      ctx.textAlign = 'left'
      ctx.textBaseline = 'bottom'
      const tw = ctx.measureText(text).width
      // Keep the whole label on screen.
      const x = Math.max(6, Math.min(at, W - tw - 8))
      const fs = Math.max(9, H * 0.024)
      ctx.fillStyle = alpha(p.sky, 0.82)
      ctx.fillRect(x - 3, y - fs - 4, tw + 6, fs + 6)
      ctx.fillStyle = color
      ctx.fillText(text, x, y)
      ctx.fillRect(x - 3, y + 2, Math.max(4, (tw + 6) * Math.min(1, k)), 1)
      ctx.globalAlpha = 1
    }

    const loop = (t: number) => {
      frame = requestAnimationFrame(loop)
      // Clamp dt so a background tab or a hitch never teleports anything.
      const dt = last ? Math.min(t - last, 64) : 16
      last = t
      draw(t, dt)
    }
    const start = () => {
      if (reduce || frame || !visible || document.hidden || disposed) return
      last = 0
      frame = requestAnimationFrame(loop)
      wrap.dataset.paused = 'false'
    }
    const stop = () => {
      cancelAnimationFrame(frame)
      frame = 0
      wrap.dataset.paused = 'true'
    }

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
    const dprQuery = window.matchMedia?.(`(resolution: ${window.devicePixelRatio || 1}dppx)`)
    dprQuery?.addEventListener('change', rebuild)
    // Night by default; the light theme redraws the same city by day, in the page's tokens.
    const unsubscribeTheme = subscribeTheme(rebuild)

    void Promise.all([document.fonts?.load(`600 12px "Geist Mono Variable"`)]).finally(() => {
      if (disposed) return
      rebuild()
      start()
    })

    return () => {
      disposed = true
      stop()
      io.disconnect()
      ro.disconnect()
      dprQuery?.removeEventListener('change', rebuild)
      unsubscribeTheme()
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [])

  return (
    <div
      ref={wrapRef}
      data-city-watch
      data-paused="true"
      className="pointer-events-none absolute inset-0"
    >
      <canvas ref={canvasRef} aria-hidden="true" className="size-full" />
    </div>
  )
}
