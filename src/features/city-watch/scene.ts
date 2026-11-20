/**
 * "City watch": the footer's night city, seen from a SOC. Everything here is pure and seeded (the
 * same city every visit, testable without a DOM).
 *
 * Units: lengths are in scene heights (1 = the band's height), so a building looks the same on a
 * phone and on an ultrawide; a wider screen simply shows more street. Time is in ms and speeds are
 * per second, so 60, 120 and 144 Hz screens all run at the same pace.
 */
import { createRandom } from '@/lib/random'

export type Theme = 'dark' | 'light'

/* ---------------------------------------------------------------------------------------------- */
/* Colour                                                                                          */
/* ---------------------------------------------------------------------------------------------- */

/** The page's own tokens, read from CSS, so the footer is always in the site's palette. */
export type Tokens = {
  canvas: string
  fg: string
  muted: string
  subtle: string
  line: string
  critical: string
  high: string
  medium: string
}

const hex = (c: string) => {
  const v = c.trim().replace('#', '')
  const full = v.length === 3 ? [...v].map((x) => x + x).join('') : v.padEnd(6, '0')
  const n = parseInt(full.slice(0, 6), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255] as const
}

/** Linear mix of two hex colours: 0 = a, 1 = b. */
export function mix(a: string, b: string, t: number): string {
  const [r1, g1, b1] = hex(a)
  const [r2, g2, b2] = hex(b)
  const k = Math.min(1, Math.max(0, t))
  const ch = (x: number, y: number) =>
    Math.round(x + (y - x) * k)
      .toString(16)
      .padStart(2, '0')
  return `#${ch(r1, r2)}${ch(g1, g2)}${ch(b1, b2)}`
}

/** Hex colour with alpha, for canvas. */
export function alpha(c: string, a: number): string {
  const [r, g, b] = hex(c)
  return `rgba(${r},${g},${b},${Math.min(1, Math.max(0, a))})`
}

export type Palette = {
  night: boolean
  sky: string
  haze: string
  /** Tower fill per depth layer: far, mid, near. */
  layers: [string, string, string]
  edge: string
  window: string
  windowAlpha: number
  shop: string
  shopGlow: string
  tube: string
  tubeLit: boolean
  street: string
  person: string
  rim: string
  ink: string
  inkSoft: string
  inkFaint: string
  critical: string
  high: string
  medium: string
}

/**
 * Night (dark theme): an inky city that rises out of the page's own black, lit in its own whites.
 * Day (light theme): the same city in overcast daylight on the page's paper tone.
 * Colour appears only as severity, exactly as on the rest of the site.
 */
export function paletteFor(theme: Theme, t: Tokens): Palette {
  const night = theme === 'dark'
  return {
    night,
    sky: t.canvas,
    haze: mix(t.canvas, t.fg, night ? 0.085 : 0.07),
    layers: night
      ? [mix(t.canvas, t.fg, 0.075), mix(t.canvas, t.fg, 0.045), mix(t.canvas, t.fg, 0.022)]
      : [mix(t.canvas, t.fg, 0.1), mix(t.canvas, t.fg, 0.17), mix(t.canvas, t.fg, 0.26)],
    edge: mix(t.canvas, t.fg, night ? 0.14 : 0.36),
    window: night ? t.fg : mix(t.canvas, t.fg, 0.5),
    windowAlpha: night ? 0.55 : 0.35,
    shop: mix(t.canvas, t.fg, night ? 0.03 : 0.3),
    shopGlow: night ? alpha(t.fg, 0.07) : alpha(t.canvas, 0.55),
    tube: night ? t.fg : mix(t.canvas, t.fg, 0.72),
    tubeLit: night,
    street: mix(t.canvas, t.fg, night ? 0.02 : 0.12),
    person: night ? mix(t.canvas, '#000000', 0.6) : mix(t.fg, t.canvas, 0.12),
    rim: mix(t.canvas, t.fg, 0.42),
    ink: t.fg,
    inkSoft: t.muted,
    inkFaint: t.subtle,
    critical: t.critical,
    high: t.high,
    medium: t.medium,
  }
}

/* ---------------------------------------------------------------------------------------------- */
/* The city                                                                                        */
/* ---------------------------------------------------------------------------------------------- */

/** Street level (top of the pavement) as a fraction of the band's height. */
export const GROUND = 0.8
/** Ground-floor shopfront height on near buildings. */
export const SHOP_H = 0.13

export type Crown = 'flat' | 'step' | 'spire' | 'slant' | 'mast'

export type Tower = {
  layer: 0 | 1 | 2
  x: number
  w: number
  /** Height above the street. */
  h: number
  crown: Crown
  cols: number
  rows: number
  /** Lit windows, as indices into the cols × rows grid. */
  lit: number[]
  /** Host name, for the near and mid buildings the SOC watches. */
  host: string
}

export type Sign = { x: number; text: string; vertical: boolean }
export type Panel = { tower: number; x: number; y: number; w: number; h: number }
export type Cable = {
  x1: number
  y1: number
  x2: number
  y2: number
  sag: number
  firewall: number
}

export type City = {
  towers: Tower[]
  signs: Sign[]
  panels: Panel[]
  cables: Cable[]
  ticker: { x: number; y: number; w: number; h: number } | null
}

const SIGN_WORDS = ['24H', 'OPEN', 'REPAIR', 'SIM', 'VPN', 'مقهى', 'NET', 'LAB', 'FIX', 'TEA']

type Range = readonly [number, number]
/** Far towers are slim and tall, near ones wide and lower (their roofs sit in front of the rest). */
const LAYER_SPEC: Record<0 | 1 | 2, { w: Range; h: Range; gap: number }> = {
  0: { w: [0.09, 0.2], h: [0.42, 0.66], gap: 0.03 },
  1: { w: [0.13, 0.26], h: [0.36, 0.6], gap: 0.05 },
  2: { w: [0.24, 0.42], h: [0.26, 0.46], gap: 0.025 },
}

function towersFor(layer: 0 | 1 | 2, span: number, random: () => number, start: number): Tower[] {
  const towers: Tower[] = []
  const spec = LAYER_SPEC[layer]
  let x = -0.08 + random() * 0.05
  let id = start
  while (x < span + 0.08) {
    const w = spec.w[0] + random() * (spec.w[1] - spec.w[0])
    const h = spec.h[0] + random() * (spec.h[1] - spec.h[0])
    const crowns: Crown[] = ['flat', 'flat', 'step', 'spire', 'slant', 'mast']
    const crown = crowns[Math.floor(random() * crowns.length)] ?? 'flat'
    // Window grid: about one window per 0.022 across and 0.03 up.
    const cols = Math.max(2, Math.round(w / 0.022))
    const rows = Math.max(3, Math.round((h - (layer === 2 ? SHOP_H : 0)) / 0.03))
    const density = layer === 0 ? 0.1 : layer === 1 ? 0.16 : 0.2
    const lit: number[] = []
    for (let i = 0; i < cols * rows; i++) if (random() < density) lit.push(i)
    towers.push({
      layer,
      x,
      w,
      h,
      crown,
      cols,
      rows,
      lit,
      host: `HOST-${(id++ * 37 + 104).toString().padStart(4, '0')}`,
    })
    x += w + random() * spec.gap
  }
  return towers
}

/** Builds the city for a street `span` scene-heights wide. */
export function buildCity(span: number, seed = 11): City {
  const random = createRandom(seed)
  const towers = [
    ...towersFor(0, span, random, 1),
    ...towersFor(1, span, random, 200),
    ...towersFor(2, span, random, 400),
  ]
  const near = towers.map((t, i) => ({ t, i })).filter(({ t }) => t.layer === 2)

  // One sign per shopfront, in a different word each time.
  let word = Math.floor(random() * SIGN_WORDS.length)
  const signs: Sign[] = near.map(({ t }) => {
    const text = SIGN_WORDS[word++ % SIGN_WORDS.length] ?? 'OPEN'
    return {
      x: t.x + t.w * (0.22 + random() * 0.56),
      text,
      vertical: text.length <= 4 && /^[A-Z0-9]+$/.test(text) && random() < 0.45,
    }
  })

  // Tall vertical screens on some near buildings (advisories cycle through them).
  const panels: Panel[] = near
    .filter(() => random() < 0.45)
    .map(({ t, i }) => {
      const w = 0.035
      const h = Math.min(0.2, t.h - SHOP_H - 0.06)
      const left = random() < 0.5
      return {
        tower: i,
        x: left ? t.x + 0.02 : t.x + t.w - 0.02 - w,
        y: GROUND - SHOP_H - 0.03 - h,
        w,
        h,
      }
    })
    .filter((p) => p.h > 0.08)

  // Data cables strung between neighbouring rooftops; each has a firewall node on it.
  const cables: Cable[] = []
  for (let k = 0; k < near.length - 1; k++) {
    const a = near[k]?.t
    const b = near[k + 1]?.t
    if (!a || !b || random() < 0.35) continue
    const y1 = GROUND - a.h + 0.03 + random() * 0.06
    const y2 = GROUND - b.h + 0.03 + random() * 0.06
    cables.push({
      x1: a.x + a.w * 0.7,
      y1,
      x2: b.x + b.w * 0.3,
      y2,
      sag: 0.03 + random() * 0.04,
      firewall: 0.4 + random() * 0.2,
    })
  }

  // A scrolling advisory ticker wrapped around the widest mid-height near building.
  const central = near
    .map(({ t }) => t)
    .filter((t) => t.x + t.w / 2 > span * 0.2 && t.x + t.w / 2 < span * 0.8)
  const host = central.sort((p, q) => q.w - p.w)[0] ?? near[0]?.t
  const ticker = host ? { x: host.x, y: GROUND - SHOP_H - 0.075, w: host.w, h: 0.045 } : null

  return { towers, signs, panels, cables, ticker }
}

/** Top of a tower's body (before its crown), in scene heights from the top. */
export const topOf = (t: Tower) => GROUND - t.h

/* ---------------------------------------------------------------------------------------------- */
/* People                                                                                          */
/* ---------------------------------------------------------------------------------------------- */

export type Walker = {
  /** Depth: 0 = far (small, hazy), 2 = near. */
  row: 0 | 1 | 2
  x: number
  /** Direction: 1 walks right, -1 left. */
  dir: 1 | -1
  /** Pace relative to an average walker; 0 = standing (waiting, on the phone). */
  pace: number
  /** Body height relative to the row's scale. */
  height: number
  build: number
  coat: number
  hood: boolean
  cap: boolean
  backpack: boolean
  umbrella: boolean
  phone: boolean
  /** Walk-cycle offset, so nobody steps in sync. */
  phase: number
}

/** Height of a figure by depth row, in scene heights. */
export const ROW_HEIGHT = [0.12, 0.16, 0.21] as const
/** Where each row's feet land, in scene heights from the top. */
export const ROW_FEET = [0.865, 0.92, 0.985] as const

export function buildWalkers(count: number, seed = 5): Walker[] {
  const random = createRandom(seed)
  const walkers: Walker[] = []
  for (let i = 0; walkers.length < count; i++) {
    const row = (i % 3) as Walker['row']
    const standing = random() < 0.12
    const phone = standing || random() < 0.22
    const w: Walker = {
      row,
      x: random(),
      dir: random() < 0.5 ? -1 : 1,
      // Most people walk at an ordinary pace; a few hurry, a few stroll.
      pace: standing ? 0 : 0.75 + random() * 0.45,
      height: 0.9 + random() * 0.2,
      build: 0.85 + random() * 0.35,
      coat: random(),
      hood: random() < 0.22,
      cap: random() < 0.15,
      backpack: random() < 0.25,
      umbrella: random() < 0.3,
      phone,
      phase: random() * Math.PI * 2,
    }
    walkers.push(w)
    // Now and then two people walk together.
    if (!standing && walkers.length < count && random() < 0.18) {
      walkers.push({
        ...w,
        x: w.x + 0.012 * -w.dir,
        height: 0.9 + random() * 0.2,
        phase: w.phase + 1.3,
        umbrella: false,
        phone: false,
        hood: random() < 0.3,
      })
    }
  }
  return walkers
}

/**
 * Walking speed in scene heights per second: about 0.8 body heights a second, like a real
 * person, with steps that match (roughly two a second) so feet don't skate.
 */
export const walkSpeed = (w: Walker) => 0.8 * ROW_HEIGHT[w.row] * w.height * w.pace

/** Steps per second for a walker. */
export const cadence = (w: Walker) => (w.pace ? 1.55 + 0.5 * w.pace : 0)

/** Where a walker is (px) at time `t` on a street `widthPx` wide and `heightPx` tall; wraps. */
export function walkerX(w: Walker, t: number, widthPx: number, heightPx: number): number {
  const margin = heightPx * 0.2
  const span = widthPx + margin * 2
  const travelled = walkSpeed(w) * heightPx * (t / 1000) * w.dir
  return ((((w.x * span + travelled) % span) + span) % span) - margin
}

/** Walk-cycle angle (radians) at time `t`: one full turn is two steps. */
export const gait = (w: Walker, t: number) => w.phase + (t / 1000) * cadence(w) * Math.PI

/* ---------------------------------------------------------------------------------------------- */
/* Security events                                                                                 */
/* ---------------------------------------------------------------------------------------------- */

/** Lines that scroll across the advisory ticker. `sev` picks a severity colour. */
export const ADVISORIES: { text: string; sev?: 'critical' | 'high' | 'medium' }[] = [
  { text: 'CVE-2026-21412', sev: 'critical' },
  { text: 'CVSS 9.8 · PATCH AVAILABLE' },
  { text: 'KB5043 ROLLOUT 78%' },
  { text: 'MFA PUSH DENIED · 03:12', sev: 'medium' },
  { text: 'EDR ISOLATED HOST-0519', sev: 'high' },
  { text: 'IOC 185.220.101.4 BLOCKED' },
  { text: 'PHISHING WAVE · 41 QUARANTINED', sev: 'medium' },
  { text: 'CERT ROTATED · *.CITY.NET' },
  { text: 'ZERO-DAY WATCH · BROWSER', sev: 'high' },
  { text: 'BACKUPS VERIFIED 04:00' },
]

/** Short messages for the vertical screens. */
export const PANEL_WORDS = ['PATCH', 'UPDATE', 'MFA', 'BACKUP', 'EDR', 'ZTNA', 'SOC']

export type Severity = 'critical' | 'high' | 'medium'

/** What the profiler can say about a passer-by's devices: first look, then resolution. */
export const PROFILES: { first: [string, string]; then?: [string, string]; sev?: Severity }[] = [
  { first: ['ENDPOINT · PHONE', 'PATCHED · 0 CVE'] },
  { first: ['ENDPOINT · LAPTOP', 'EDR ONLINE'] },
  { first: ['WEARABLE', 'FIRMWARE 4.2 · OK'] },
  {
    first: ['ENDPOINT · PHONE', 'OS 41 DAYS BEHIND'],
    then: ['UPDATE PUSHED', 'PATCHED'],
    sev: 'medium',
  },
  {
    first: ['ENDPOINT · LAPTOP', 'CVE-2026-0420 · 8.1'],
    then: ['PATCH APPLIED', 'REBOOT DONE'],
    sev: 'high',
  },
  { first: ['ANOMALY', 'IMPOSSIBLE TRAVEL'], then: ['TRIAGED', 'BENIGN · VPN EXIT'], sev: 'high' },
  { first: ['ANOMALY', 'BEACONING · 60 S'], then: ['CONTAINED', 'HOST ISOLATED'], sev: 'critical' },
]

/** Packet position (0–1 along its cable) at time `t` for packet `k` of `n` on a cable. */
export function packetAt(t: number, k: number, n: number, period = 4200): number {
  return (((t / period + k / n) % 1) + 1) % 1
}

/** A point on a sagging cable at `s` (0–1). */
export function cablePoint(c: Cable, s: number): { x: number; y: number } {
  return {
    x: c.x1 + (c.x2 - c.x1) * s,
    y: c.y1 + (c.y2 - c.y1) * s + Math.sin(Math.PI * s) * c.sag,
  }
}
