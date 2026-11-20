import { useEffect, useRef } from 'react'
import { site } from '@/content/site'
import { createRandom } from '@/lib/random'
import { getTheme, subscribeTheme } from '@/lib/theme'
import {
  buildShops,
  buildTowers,
  buildWalkers,
  ROW_SCALE,
  signOn,
  stride,
  trainX,
  walkerX,
  type Shop,
  type Sign,
  type Tower,
  type Theme,
  type Walker,
} from './scene'

/*
 * The footer's neon district: a night street in a dense future city, drawn on one canvas.
 * Static parts (sky, towers, rail, shopfronts, wet street) are rendered once per size and theme;
 * each frame only draws what moves: neon flicker, the hologram, the train, flying cars, people,
 * rain and the odd scan bracket. Light theme is the same street by day, with the signs switched
 * off and no rain. No pointer interaction anywhere.
 */

type Palette = {
  skyTop: string
  skyBottom: string
  haze: string
  tower: string
  towerEdge: string
  windows: string[]
  shop: string
  shopEdge: string
  street: string
  curb: string
  rail: string
  person: string
  rain: string | null
  boardBg: string
  boardInk: string
  boardFrame: string
  label: string
  neon: boolean
  beacon: string
  train: string
  trainWindow: string
  car: string
}

const PALETTES: Record<Theme, Palette> = {
  dark: {
    skyTop: '#05060b',
    skyBottom: '#1b1030',
    haze: 'rgba(255,46,136,0.10)',
    tower: '#0d0f17',
    towerEdge: '#1b1e2c',
    windows: ['#ffd38a', '#7ad7ff', '#ffb4d8'],
    shop: '#0a0b11',
    shopEdge: '#262a40',
    street: '#06070b',
    curb: '#1d2030',
    rail: '#151826',
    person: '#030306',
    rain: 'rgba(170,190,215,0.32)',
    boardBg: 'rgba(46,230,255,0.07)',
    boardInk: '#2ee6ff',
    boardFrame: '#1f3044',
    label: '#c9d2e0',
    neon: true,
    beacon: '#ff3b3b',
    train: '#121521',
    trainWindow: '#ffe7b0',
    car: '#0f1118',
  },
  light: {
    skyTop: '#cdd5df',
    skyBottom: '#efece6',
    haze: 'rgba(255,255,255,0)',
    tower: '#bcc3cd',
    towerEdge: '#a5adb8',
    windows: ['#e8ebef'],
    shop: '#aab1bb',
    shopEdge: '#868e9a',
    street: '#c3c8cf',
    curb: '#959ca7',
    rail: '#8c939e',
    person: '#262a31',
    rain: null,
    boardBg: '#f4f2ed',
    boardInk: '#262a31',
    boardFrame: '#8c939e',
    label: '#3d434d',
    neon: false,
    beacon: '#b8382c',
    train: '#7a828f',
    trainWindow: '#e3e7ec',
    car: '#59606c',
  },
}

const MONO = '"Geist Mono Variable", "Segoe UI", "Noto Sans Arabic", ui-monospace, monospace'
const DISPLAY = '"Archivo Variable", "Archivo Fallback", sans-serif'
const NAME = `${(site.name.split(' ')[0] ?? site.name).toUpperCase()}.`
const isLatin = (text: string) => /^[A-Z0-9]+$/.test(text)

type Layout = {
  w: number
  h: number
  horizon: number
  railY: number
  ground: number
  board: { x: number; y: number; w: number; h: number }
}

function layoutFor(w: number, h: number): Layout {
  // The billboard spans most of a phone, but stays a billboard (not a wall) on an ultrawide.
  const bh = Math.min(h * 0.3, w * 0.17)
  const bw = bh * 4.6
  return {
    w,
    h,
    horizon: h * 0.66,
    railY: h * 0.47,
    ground: h * 0.86,
    board: { x: (w - bw) / 2, y: h * 0.07, w: bw, h: bh },
  }
}

/* ------------------------------------------------------------------------------------------ */
/* Pre-rendered layers                                                                         */
/* ------------------------------------------------------------------------------------------ */

function canvasOf(w: number, h: number, dpr: number) {
  const c = document.createElement('canvas')
  c.width = Math.max(1, Math.round(w * dpr))
  c.height = Math.max(1, Math.round(h * dpr))
  const ctx = c.getContext('2d')
  ctx?.scale(dpr, dpr)
  return { c, ctx }
}

function drawSignBody(
  ctx: CanvasRenderingContext2D,
  sign: Sign,
  shop: Shop,
  L: Layout,
  p: Palette,
  lit: boolean,
) {
  const size = Math.max(9, L.h * 0.034)
  ctx.font = `700 ${size}px ${MONO}`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  const vertical = sign.vertical && isLatin(sign.text)
  const chars = vertical ? Array.from(sign.text) : [sign.text]
  const step = size * 1.05
  const bw = vertical ? size * 1.5 : ctx.measureText(sign.text).width + size * 1.2
  const bh = vertical ? chars.length * step + size * 0.8 : size * 1.7
  const x = sign.x * L.h
  const y = L.ground - shop.h * L.h * (1 - sign.y)
  // Sign box.
  ctx.fillStyle = p.shop
  ctx.strokeStyle = lit ? sign.color : p.shopEdge
  ctx.lineWidth = lit ? 1.5 : 1.2
  ctx.globalAlpha = 1
  ctx.beginPath()
  ctx.roundRect(x - bw / 2, y, bw, bh, 3)
  ctx.fill()
  ctx.stroke()
  // Tube lettering: glowing when lit, painted grey when off.
  ctx.fillStyle = lit ? sign.color : p.shopEdge
  if (lit) {
    ctx.shadowColor = sign.color
    ctx.shadowBlur = size * 0.9
  }
  chars.forEach((ch, i) =>
    ctx.fillText(ch, x, vertical ? y + size * 0.4 + step * (i + 0.5) : y + bh / 2),
  )
  ctx.shadowBlur = 0
  return { x, y, bw, bh }
}

/** Everything that doesn't move. */
function renderStatic(L: Layout, dpr: number, p: Palette, towers: Tower[], shops: Shop[]) {
  const { c, ctx } = canvasOf(L.w, L.h, dpr)
  if (!ctx) return c
  // Sky and horizon haze.
  const sky = ctx.createLinearGradient(0, 0, 0, L.horizon)
  sky.addColorStop(0, p.skyTop)
  sky.addColorStop(1, p.skyBottom)
  ctx.fillStyle = sky
  ctx.fillRect(0, 0, L.w, L.h)
  const haze = ctx.createRadialGradient(L.w / 2, L.horizon, 0, L.w / 2, L.horizon, L.w * 0.6)
  haze.addColorStop(0, p.haze)
  haze.addColorStop(1, 'transparent')
  ctx.fillStyle = haze
  ctx.fillRect(0, 0, L.w, L.h)

  // Towers with a scatter of lit windows.
  const random = createRandom(9)
  for (const t of towers) {
    const x = t.x * L.h
    const tw = t.w * L.h
    const th = t.h * L.h * 0.62
    const top = L.horizon - th
    ctx.fillStyle = p.tower
    ctx.fillRect(x, top, tw, L.h - top)
    ctx.fillStyle = p.towerEdge
    ctx.fillRect(x, top, tw, 1)
    if (t.spire) {
      ctx.fillStyle = p.tower
      ctx.fillRect(x + tw / 2 - 1.5, top - t.spire * L.h, 3, t.spire * L.h)
    }
    const cols = Math.max(2, Math.round(t.w * 21))
    const rows = Math.max(4, Math.round(t.h * 28))
    const cw = tw / cols
    const ch = th / rows
    for (const i of t.lights) {
      const cx = x + (i % cols) * cw + cw * 0.3
      const cy = top + Math.floor(i / cols) * ch + ch * 0.3
      ctx.globalAlpha = p.neon ? 0.35 + random() * 0.5 : 0.7
      ctx.fillStyle = p.windows[Math.floor(random() * p.windows.length)] ?? p.tower
      ctx.fillRect(cx, cy, Math.max(1, cw * 0.4), Math.max(1, ch * 0.35))
    }
    ctx.globalAlpha = 1
  }

  // Billboard structure (the lettering is drawn live so it can flicker).
  const b = L.board
  ctx.fillStyle = p.boardFrame
  ctx.fillRect(b.x + b.w * 0.2, b.y + b.h, 3, L.horizon - b.y - b.h)
  ctx.fillRect(b.x + b.w * 0.8, b.y + b.h, 3, L.horizon - b.y - b.h)

  // Elevated rail and its pillars.
  ctx.fillStyle = p.rail
  ctx.fillRect(0, L.railY, L.w, Math.max(4, L.h * 0.014))
  for (let x = 30; x < L.w; x += Math.max(110, L.h * 0.45))
    ctx.fillRect(x, L.railY, Math.max(5, L.h * 0.016), L.ground - L.railY)

  // Shopfronts, awnings and their signs (unlit bodies; lit tubes are drawn per frame).
  for (const s of shops) {
    const x = s.x * L.h
    const sw = s.w * L.h
    const top = L.ground - s.h * L.h
    ctx.fillStyle = p.shop
    ctx.fillRect(x, top, sw, L.ground - top)
    ctx.strokeStyle = p.shopEdge
    ctx.lineWidth = 1
    ctx.strokeRect(x + 0.5, top + 0.5, sw - 1, L.ground - top)
    // Shop window glow / glass.
    ctx.fillStyle = p.neon ? 'rgba(255,200,140,0.08)' : 'rgba(255,255,255,0.35)'
    ctx.fillRect(x + sw * 0.1, L.ground - L.h * 0.09, sw * 0.8, L.h * 0.07)
    // AC units on the facade.
    ctx.fillStyle = p.shopEdge
    ctx.fillRect(x + sw * 0.7, top + L.h * 0.05, sw * 0.12, L.h * 0.025)
    for (const sign of s.signs) drawSignBody(ctx, sign, s, L, p, false)
  }

  // Street, curb and (at night) the neon reflected in the wet road.
  ctx.fillStyle = p.street
  ctx.fillRect(0, L.ground, L.w, L.h - L.ground)
  ctx.fillStyle = p.curb
  ctx.fillRect(0, L.ground, L.w, 2)
  if (p.neon) {
    for (const s of shops) {
      for (const sign of s.signs) {
        const x = sign.x * L.h
        const g = ctx.createLinearGradient(0, L.ground, 0, L.h)
        g.addColorStop(0, sign.color)
        g.addColorStop(1, 'transparent')
        ctx.globalAlpha = 0.16
        ctx.fillStyle = g
        ctx.fillRect(x - L.h * 0.02, L.ground + 2, L.h * 0.04, L.h - L.ground)
      }
    }
    ctx.globalAlpha = 1
  }
  return c
}

/** The hologram billboard with MOHANNAD. on it. */
function renderBoard(L: Layout, dpr: number, p: Palette) {
  const b = L.board
  const { c, ctx } = canvasOf(b.w, b.h, dpr)
  if (!ctx) return c
  ctx.fillStyle = p.boardBg
  ctx.fillRect(0, 0, b.w, b.h)
  ctx.strokeStyle = p.boardFrame
  ctx.lineWidth = 2
  ctx.strokeRect(1, 1, b.w - 2, b.h - 2)
  // Condensed lettering: fit the width, then stretch vertically to fill the panel.
  let size = b.h * 0.8
  ctx.font = `800 ${size}px ${DISPLAY}`
  size = Math.min(size, size * ((b.w * 0.9) / ctx.measureText(NAME).width))
  ctx.font = `800 ${size}px ${DISPLAY}`
  const m = ctx.measureText(NAME)
  const ink = m.actualBoundingBoxAscent + m.actualBoundingBoxDescent || size * 0.72
  const stretch = Math.min(1.9, Math.max(1, (b.h * 0.7) / ink))
  ctx.save()
  ctx.translate(b.w / 2, b.h / 2 + (ink * stretch) / 2)
  ctx.scale(1, stretch)
  ctx.textAlign = 'center'
  ctx.textBaseline = 'alphabetic'
  ctx.fillStyle = p.boardInk
  if (p.neon) {
    ctx.shadowColor = p.boardInk
    ctx.shadowBlur = size * 0.35
  }
  const baseline = -m.actualBoundingBoxDescent
  if (p.neon) {
    // Hologram colour split: a magenta ghost a hair to the left of the cyan.
    ctx.globalAlpha = 0.55
    ctx.fillStyle = '#ff2e88'
    ctx.shadowColor = '#ff2e88'
    ctx.fillText(NAME, -Math.max(2, size * 0.025), baseline)
    ctx.globalAlpha = 1
    ctx.fillStyle = p.boardInk
    ctx.shadowColor = p.boardInk
  }
  ctx.fillText(NAME, 0, baseline)
  ctx.restore()
  // Scanlines on the hologram only; by day it's a printed board.
  if (p.neon) {
    ctx.globalAlpha = 0.22
    ctx.fillStyle = p.skyTop
    for (let y = 0; y < b.h; y += 3) ctx.fillRect(0, y, b.w, 1)
    ctx.globalAlpha = 1
  }
  return c
}

/* ------------------------------------------------------------------------------------------ */
/* Moving parts                                                                                */
/* ------------------------------------------------------------------------------------------ */

function drawPerson(
  ctx: CanvasRenderingContext2D,
  x: number,
  feet: number,
  u: number,
  w: Walker,
  t: number,
  color: string,
) {
  const r = u * 0.075
  const headY = feet - u + r
  const neck = headY + r
  const shoulder = (u * 0.26 * w.build) / 2
  const hip = feet - u * 0.46
  const hem = hip + u * w.coat * 0.32
  const swing = stride(w, t)
  const leg = feet - hip
  ctx.fillStyle = color
  ctx.strokeStyle = color
  ctx.lineCap = 'round'
  // Legs.
  ctx.lineWidth = u * 0.07
  ctx.beginPath()
  ctx.moveTo(x - u * 0.03, hip)
  ctx.lineTo(x - u * 0.03 + Math.sin(swing) * leg, feet)
  ctx.moveTo(x + u * 0.03, hip)
  ctx.lineTo(x + u * 0.03 - Math.sin(swing) * leg, feet)
  ctx.stroke()
  // Coat.
  ctx.beginPath()
  ctx.moveTo(x - shoulder, neck + u * 0.02)
  ctx.lineTo(x + shoulder, neck + u * 0.02)
  ctx.lineTo(x + shoulder * 0.95, hem)
  ctx.lineTo(x - shoulder * 0.95, hem)
  ctx.closePath()
  ctx.fill()
  // Arms (one holds the umbrella still).
  ctx.lineWidth = u * 0.055
  ctx.beginPath()
  ctx.moveTo(x - shoulder * 0.85, neck + u * 0.05)
  ctx.lineTo(x - shoulder * 0.85 - Math.sin(swing) * u * 0.18, hip + u * 0.02)
  if (!w.umbrella) {
    ctx.moveTo(x + shoulder * 0.85, neck + u * 0.05)
    ctx.lineTo(x + shoulder * 0.85 + Math.sin(swing) * u * 0.18, hip + u * 0.02)
  }
  ctx.stroke()
  // Head, hood.
  ctx.beginPath()
  ctx.arc(x, headY, w.hood ? r * 1.25 : r, 0, Math.PI * 2)
  ctx.fill()
  if (w.umbrella) {
    ctx.lineWidth = u * 0.02
    ctx.beginPath()
    ctx.moveTo(x + shoulder * 0.8, hip - u * 0.08)
    ctx.lineTo(x + shoulder * 0.8, headY - u * 0.2)
    ctx.stroke()
    ctx.beginPath()
    ctx.ellipse(x + shoulder * 0.8, headY - u * 0.2, u * 0.3, u * 0.12, 0, Math.PI, 0)
    ctx.fill()
  }
}

type Scan = {
  walker: number
  label: string
  anomaly: boolean
  triaged: boolean
  until: number
  triageAt: number
}

export default function NeonDistrict() {
  const wrapRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const wrap = wrapRef.current
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!wrap || !canvas || !ctx) return

    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
    let towers: Tower[] = []
    let shops: Shop[] = []
    let walkers: Walker[] = []
    let layout: Layout | null = null
    let palette = PALETTES[getTheme()]
    let staticLayer: HTMLCanvasElement | null = null
    let board: HTMLCanvasElement | null = null
    let litSigns: { sign: Sign; sprite: HTMLCanvasElement; x: number; y: number }[] = []
    let rain: { x: number; y: number; len: number; speed: number }[] = []
    let cars: { y: number; x: number; speed: number; size: number }[] = []
    let scans: Scan[] = []
    let dpr = 1
    let frame = 0
    let last = 0
    let nextScan = 0
    let visible = false
    let disposed = false
    const random = createRandom(77)

    const rebuild = () => {
      const rect = wrap.getBoundingClientRect()
      if (rect.width < 10 || rect.height < 10) return
      dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = Math.round(rect.width * dpr)
      canvas.height = Math.round(rect.height * dpr)
      const L = layoutFor(rect.width, rect.height)
      layout = L
      towers = buildTowers(L.w / L.h)
      shops = buildShops(L.w / L.h)
      const theme = getTheme()
      palette = PALETTES[theme]
      wrap.dataset.scene = theme === 'dark' ? 'night' : 'day'
      staticLayer = renderStatic(L, dpr, palette, towers, shops)
      board = renderBoard(L, dpr, palette)
      // Lit sign sprites (night only): drawn per frame so they can flicker.
      litSigns = palette.neon
        ? shops.flatMap((s) =>
            s.signs.map((sign) => {
              const { c, ctx: sctx } = canvasOf(L.w, L.h, dpr)
              let box = { x: 0, y: 0, bw: 0, bh: 0 }
              if (sctx) box = drawSignBody(sctx, sign, s, L, palette, true)
              return { sign, sprite: c, x: box.x, y: box.y }
            }),
          )
        : []
      // Density scales with the street: fewer people and drops on a phone.
      // Umbrellas only come out in the rain (night).
      walkers = buildWalkers(Math.round(Math.min(56, Math.max(9, L.w / 46)))).map((w) =>
        palette.rain ? w : { ...w, umbrella: false },
      )
      rain = palette.rain
        ? Array.from({ length: Math.round((L.w * L.h) / 3200) }, () => ({
            x: random() * L.w,
            y: random() * L.h,
            len: 8 + random() * 10,
            speed: 650 + random() * 350,
          }))
        : []
      cars = Array.from({ length: L.w > 640 ? 4 : 2 }, (_, i) => ({
        y: L.h * (0.16 + random() * 0.3),
        x: random() * L.w,
        speed: (i % 2 ? -1 : 1) * (70 + random() * 90),
        size: L.h * (0.018 + random() * 0.012),
      }))
      draw(reduce ? 2600 : performance.now(), 0)
    }

    const feetOf = (row: 0 | 1 | 2, L: Layout) =>
      [L.h * 0.915, L.h * 0.955, L.h * 0.995][row] ?? L.h

    const draw = (t: number, dt: number) => {
      const L = layout
      if (!L || !staticLayer || !board) return
      const p = palette
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.drawImage(staticLayer, 0, 0)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

      // Aviation beacons on the tallest towers.
      const blink = Math.floor(t / 900) % 2 === 0
      if (blink) {
        ctx.fillStyle = p.beacon
        for (const tower of towers) {
          if (!tower.beacon) continue
          const top = L.horizon - tower.h * L.h * 0.62 - tower.spire * L.h
          ctx.fillRect(tower.x * L.h + (tower.w * L.h) / 2 - 1.5, top - 3, 3, 3)
        }
      }

      // Hologram: flickers a little, and now and then glitches into offset slices.
      const b = L.board
      const glitch = p.neon && !reduce && t % 5200 < 140
      ctx.globalAlpha = p.neon && !reduce ? 0.86 + 0.14 * Math.sin(t / 90) * Math.sin(t / 37) : 1
      if (glitch) {
        const slices = 5
        for (let i = 0; i < slices; i++) {
          const sy = (board.height / slices) * i
          const off = (random() - 0.5) * 16
          ctx.drawImage(
            board,
            0,
            sy,
            board.width,
            board.height / slices,
            b.x + off,
            b.y + (b.h / slices) * i,
            b.w,
            b.h / slices,
          )
        }
      } else {
        ctx.drawImage(board, b.x, b.y, b.w, b.h)
      }
      ctx.globalAlpha = 1

      // Flying cars with light trails.
      for (const car of cars) {
        if (dt) car.x += (car.speed * dt) / 1000
        if (car.x > L.w + 60) car.x = -60
        if (car.x < -60) car.x = L.w + 60
        const dir = Math.sign(car.speed)
        ctx.fillStyle = p.car
        ctx.fillRect(car.x - car.size, car.y - car.size * 0.3, car.size * 2, car.size * 0.6)
        if (p.neon) {
          const trail = ctx.createLinearGradient(car.x - dir * car.size * 6, 0, car.x, 0)
          trail.addColorStop(0, 'transparent')
          trail.addColorStop(1, 'rgba(255,60,90,0.5)')
          ctx.fillStyle = trail
          ctx.fillRect(Math.min(car.x, car.x - dir * car.size * 6), car.y - 1, car.size * 6, 2)
          ctx.fillStyle = '#fff6e0'
          ctx.fillRect(car.x + dir * car.size - 1, car.y - 1, 2, 2)
        }
      }

      // The train on the elevated line.
      const trainLen = Math.min(L.w * 0.5, 420)
      const tx = reduce ? null : trainX(t, L.w, trainLen)
      if (tx !== null) {
        const th = Math.max(10, L.h * 0.04)
        const ty = L.railY - th
        ctx.fillStyle = p.train
        ctx.beginPath()
        ctx.roundRect(tx - trainLen, ty, trainLen, th, th * 0.4)
        ctx.fill()
        ctx.fillStyle = p.trainWindow
        for (let wx = tx - trainLen + 8; wx < tx - 10; wx += th * 1.2) {
          ctx.globalAlpha = p.neon ? 0.8 : 0.9
          ctx.fillRect(wx, ty + th * 0.25, th * 0.7, th * 0.35)
        }
        ctx.globalAlpha = 1
      }

      // Neon signs, flickering on their own rhythm.
      for (const s of litSigns) {
        if (!reduce && !signOn(s.sign, t)) continue
        ctx.setTransform(1, 0, 0, 1, 0, 0)
        ctx.drawImage(s.sprite, 0, 0)
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      }

      // People: far rows first, a thin neon rim light at night.
      const base = L.h * 0.24
      const ordered = walkers.map((w, i) => ({ w, i })).sort((a, b2) => a.w.row - b2.w.row)
      const positions = new Map<number, { x: number; feet: number; u: number }>()
      for (const { w, i } of ordered) {
        const u = base * ROW_SCALE[w.row]
        const x = walkerX(w, reduce ? 0 : t, L.w)
        const feet = feetOf(w.row, L)
        const time = reduce ? 0 : t
        positions.set(i, { x, feet, u })
        if (p.neon) {
          ctx.globalAlpha = 0.85
          drawPerson(ctx, x - 1.4, feet, u, w, time, w.rim)
          ctx.globalAlpha = 1
        }
        drawPerson(ctx, x, feet, u, w, time, p.person)
        if (w.visor && p.neon) {
          ctx.fillStyle = '#2ee6ff'
          ctx.fillRect(x - u * 0.06, feet - u + u * 0.06, u * 0.12, Math.max(1, u * 0.018))
        }
      }

      // Rain (night only).
      if (p.rain && rain.length) {
        ctx.strokeStyle = p.rain
        ctx.lineWidth = 1
        ctx.beginPath()
        for (const d of rain) {
          if (dt) {
            d.y += (d.speed * dt) / 1000
            d.x -= (d.speed * 0.18 * dt) / 1000
            if (d.y > L.h) {
              d.y = -d.len
              d.x = random() * (L.w + 80)
            }
          }
          ctx.moveTo(d.x, d.y)
          ctx.lineTo(d.x - d.len * 0.18, d.y + d.len)
        }
        ctx.stroke()
      }

      // Scan brackets lock onto a passer-by now and then (never on the pointer's say-so).
      if (!reduce && t > nextScan && scans.length < 2) {
        const candidates = [...positions.entries()].filter(
          ([i, pos]) =>
            (walkers[i]?.row ?? 0) > 0 &&
            pos.x > 60 &&
            pos.x < L.w - 160 &&
            !scans.some((s) => Math.abs((positions.get(s.walker)?.x ?? -1e4) - pos.x) < 240),
        )
        const pick = candidates[Math.floor(random() * candidates.length)]
        if (pick) {
          const anomaly = random() < 0.25
          scans.push({
            walker: pick[0],
            anomaly,
            triaged: false,
            label: anomaly
              ? `ANOMALY 0.${20 + Math.floor(random() * 20)}`
              : `SCAN · BENIGN 0.${90 + Math.floor(random() * 9)}`,
            until: t + 2600,
            triageAt: t + 1300,
          })
        }
        nextScan = t + 1500 + random() * 1200
      }
      if (reduce && !scans.length) {
        const near = [...positions.keys()].find((i) => walkers[i]?.row === 2)
        if (near !== undefined)
          scans.push({
            walker: near,
            label: 'SCAN · BENIGN 0.97',
            anomaly: false,
            triaged: false,
            until: Infinity,
            triageAt: Infinity,
          })
      }
      scans = scans.filter((s) => s.until > t)
      if (wrap.dataset.scans !== String(scans.length)) wrap.dataset.scans = String(scans.length)
      for (const s of scans) {
        const pos = positions.get(s.walker)
        if (!pos) continue
        if (s.anomaly && !s.triaged && t > s.triageAt) {
          s.triaged = true
          s.label = 'TRIAGED · BENIGN'
        }
        const color = !p.neon ? p.label : s.anomaly && !s.triaged ? '#ffb020' : '#2ee6ff'
        const bw = pos.u * 0.5
        const bh = pos.u * 1.08
        const bx = pos.x - bw / 2
        const by = pos.feet - pos.u - pos.u * 0.04
        const k = Math.min(10, bw * 0.25)
        ctx.strokeStyle = color
        ctx.lineWidth = 1.5
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
        ctx.stroke()
        ctx.font = `600 ${Math.max(9, L.h * 0.026)}px ${MONO}`
        ctx.textAlign = 'left'
        ctx.textBaseline = 'bottom'
        // A dark (or paper) chip behind the label keeps it legible over signs and people.
        const tw = ctx.measureText(s.label).width
        const fs = Math.max(9, L.h * 0.026)
        ctx.fillStyle = p.neon ? 'rgba(5,6,11,0.72)' : 'rgba(244,242,237,0.85)'
        ctx.fillRect(bx - 3, by - 6 - fs, tw + 6, fs + 4)
        ctx.fillStyle = color
        ctx.fillText(s.label, bx, by - 4)
      }
    }

    const loop = (t: number) => {
      frame = requestAnimationFrame(loop)
      // Clamp dt so a background tab or a hitch doesn't teleport anything.
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
    // Night by default; the light theme redraws the same street by day.
    const unsubscribeTheme = subscribeTheme(rebuild)

    void Promise.all([
      document.fonts?.load(`800 100px "Archivo Variable"`),
      document.fonts?.load(`700 12px "Geist Mono Variable"`),
    ]).finally(() => {
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
      data-neon-district
      data-paused="true"
      className="pointer-events-none absolute inset-0"
    >
      <canvas ref={canvasRef} aria-hidden="true" className="size-full" />
    </div>
  )
}
