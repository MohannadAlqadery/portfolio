/**
 * Layout and motion for the footer's "neon district": a night street in a dense future city.
 * Everything here is pure and seeded (same city every visit, testable without a DOM), and all
 * motion is in px per second / ms, so 60, 120 and 144 Hz screens run at the same speed.
 *
 * Sizes are in units of the scene height (so a tower looks the same on a phone and on an
 * ultrawide; wider screens just show more street), unless a name says px.
 */
import { createRandom } from '@/lib/random'

export type Theme = 'dark' | 'light'

/** Neon tube colours. No green: on this site green only ever means "Active". */
export const NEON = ['#ff2e88', '#2ee6ff', '#ffb020', '#a066ff'] as const

export type Tower = {
  x: number
  w: number
  h: number
  spire: number
  lights: number[]
  beacon: boolean
}
export type Sign = {
  x: number
  y: number
  text: string
  vertical: boolean
  color: string
  /** Seconds between flickers; 0 = steady. */
  flicker: number
}
export type Shop = { x: number; w: number; h: number; signs: Sign[] }
export type Walker = {
  /** Depth row: 0 = far (small), 2 = near (large). */
  row: 0 | 1 | 2
  /** Start position across the street (fraction). */
  x: number
  /** px per second at full scale; negative walks left. */
  speed: number
  /** Steps per second. */
  cadence: number
  umbrella: boolean
  visor: boolean
  hood: boolean
  /** Coat length and build, for variety. */
  coat: number
  build: number
  rim: string
}

const SIGN_WORDS = ['SOC', '24H', 'CAFE', 'NET', 'OPEN', 'RAMEN', 'مقهى', 'DATA', 'NOODLE', 'FIX']

/** Towers across a street `span` scene-heights wide. */
export function buildTowers(span: number, seed = 7): Tower[] {
  const random = createRandom(seed)
  const towers: Tower[] = []
  let x = -0.05
  while (x < span + 0.05) {
    const w = 0.1 + random() * 0.17
    const h = 0.3 + random() * 0.45
    const cols = Math.max(2, Math.round(w * 21))
    const rows = Math.max(4, Math.round(h * 28))
    // Lit windows as indices into a cols × rows grid; most of the city is asleep.
    const lights: number[] = []
    for (let i = 0; i < cols * rows; i++) if (random() < 0.14) lights.push(i)
    towers.push({
      x,
      w,
      h,
      spire: random() < 0.3 ? 0.03 + random() * 0.06 : 0,
      lights,
      beacon: random() < 0.4,
    })
    x += w + random() * 0.03
  }
  return towers
}

/**
 * Shopfronts across a street `span` scene-heights wide. A sign's `x` is in scene heights like the
 * shop's; its `y` is a fraction of the shop's height down from the shop's top.
 */
export function buildShops(span: number, seed = 13): Shop[] {
  const random = createRandom(seed)
  const shops: Shop[] = []
  let x = -0.03
  let word = Math.floor(random() * SIGN_WORDS.length)
  while (x < span + 0.03) {
    const w = 0.24 + random() * 0.24
    const h = 0.2 + random() * 0.14
    const signs: Sign[] = []
    const count = w > 0.36 && random() < 0.6 ? 2 : 1
    for (let i = 0; i < count; i++) {
      const text = SIGN_WORDS[word++ % SIGN_WORDS.length] ?? 'OPEN'
      // Only short words hang vertically, so a sign never reaches past its shop.
      const vertical = text.length <= 4 && /^[A-Z0-9]+$/.test(text) && random() < 0.6
      // Two signs take a half each, so they never overlap.
      const slot = count === 2 ? 0.08 + i * 0.5 : 0.2
      signs.push({
        x: x + w * (slot + 0.12 + random() * 0.18),
        y: vertical ? 0.08 : 0.1 + random() * 0.12,
        text,
        vertical,
        color: NEON[Math.floor(random() * NEON.length)] ?? NEON[0],
        flicker: random() < 0.3 ? 2 + random() * 6 : 0,
      })
    }
    shops.push({ x, w, h, signs })
    x += w
  }
  return shops
}

export function buildWalkers(count: number, seed = 3): Walker[] {
  const random = createRandom(seed)
  return Array.from({ length: count }, (_, i) => {
    const row = (i % 3) as Walker['row']
    const dir = random() < 0.5 ? -1 : 1
    return {
      row,
      x: random(),
      speed: dir * (34 + random() * 28),
      cadence: 1.6 + random() * 0.6,
      umbrella: random() < 0.28,
      visor: random() < 0.25,
      hood: random() < 0.3,
      coat: 0.45 + random() * 0.35,
      build: 0.85 + random() * 0.3,
      rim: NEON[Math.floor(random() * NEON.length)] ?? NEON[1],
    }
  })
}

/** Scale of a figure by depth row (near people are bigger and lower on the pavement). */
export const ROW_SCALE = [0.62, 0.8, 1] as const

/** Where a walker is at time `t` (ms) on a street `width` px wide; wraps around the edges. */
export function walkerX(w: Walker, t: number, width: number, margin = 60): number {
  const span = width + margin * 2
  const start = w.x * span
  const travelled = (w.speed * ROW_SCALE[w.row] * t) / 1000
  return ((((start + travelled) % span) + span) % span) - margin
}

/** Leg swing in radians for the walk cycle at time `t` (ms). */
export function stride(w: Walker, t: number): number {
  return Math.sin((t / 1000) * w.cadence * Math.PI * 2) * 0.45
}

/** The elevated train crosses every `period` ms; returns its nose x in px, or null when away. */
export function trainX(
  t: number,
  width: number,
  length: number,
  period = 16000,
  cross = 5200,
): number | null {
  const phase = t % period
  if (phase > cross) return null
  // Right to left.
  return width + length - (phase / cross) * (width + length * 2)
}

/** Neon flicker: mostly on, with brief dropouts for signs that have a flicker period. */
export function signOn(sign: Sign, t: number): boolean {
  if (!sign.flicker) return true
  const phase = (t / 1000) % sign.flicker
  return !(phase < 0.12 || (phase > 0.2 && phase < 0.26))
}
