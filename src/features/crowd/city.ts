/**
 * A hand-drawn-style city skyline for the footer street scene, generated from a seed so it is the
 * same drawing on every load (and in tests). Coordinates live in a 1600 × 400 viewBox with the
 * ground at y = 400; the SVG is anchored to the bottom and cropped at the sides on narrow screens.
 */
import { createRandom } from '@/lib/random'

export const SKY_W = 1600
export const SKY_H = 400

export type Building = {
  kind: 'block' | 'tower' | 'tank' | 'dome' | 'crane' | 'stepped'
  x: number
  w: number
  /** Height above the ground. */
  h: number
  /** Window grid: columns × rows, or 0 for none. */
  cols: number
  rows: number
  /** Diagonal ink hatching for a shaded face. */
  hatch: boolean
  /** Antenna / mast height on top, or 0. */
  mast: number
}

/** Walk left to right placing buildings; one dome + minaret and one crane, the rest varied. */
export function buildSkyline(seed = 21): Building[] {
  const random = createRandom(seed)
  const pick = <T>(items: T[]): T => items[Math.floor(random() * items.length)] as T
  const buildings: Building[] = []
  // Landmarks at fixed-ish positions so they stay visible when the sides are cropped.
  const domeAt = SKY_W * 0.62
  const craneAt = SKY_W * 0.3
  let x = -20
  let placedDome = false
  let placedCrane = false

  while (x < SKY_W + 20) {
    let kind: Building['kind'] = pick(['block', 'block', 'tower', 'tank', 'stepped'])
    if (!placedDome && x >= domeAt) {
      kind = 'dome'
      placedDome = true
    } else if (!placedCrane && x >= craneAt) {
      kind = 'crane'
      placedCrane = true
    }

    const w =
      kind === 'dome'
        ? 150
        : kind === 'crane'
          ? 110
          : kind === 'tower'
            ? 60 + random() * 40
            : 70 + random() * 90
    const h =
      kind === 'tower'
        ? 220 + random() * 90
        : kind === 'dome'
          ? 150
          : kind === 'crane'
            ? 300
            : kind === 'stepped'
              ? 170 + random() * 90
              : 110 + random() * 120

    const cols = kind === 'crane' || kind === 'dome' ? 0 : Math.max(2, Math.floor(w / 22))
    const rows = cols ? Math.max(3, Math.floor(h / 30)) : 0
    buildings.push({
      kind,
      x: Math.round(x),
      w: Math.round(w),
      h: Math.round(h),
      cols,
      rows,
      hatch: kind !== 'crane' && random() < 0.35,
      mast: kind === 'tower' && random() < 0.7 ? 24 + Math.round(random() * 26) : 0,
    })
    x += w + (random() < 0.4 ? 0 : 6 + random() * 18)
  }
  return buildings
}

/** Height of a building's highest point (roof pieces, masts, minaret) above the ground. */
export function topOf(b: Building): number {
  const extra = { block: 0, tower: 22 + b.mast, stepped: 60, tank: 40, dome: 86, crane: 26 }[b.kind]
  return b.h + extra
}

/** A few birds (a "v" stroke each) for the sky: height, size and timing. */
export type Bird = { y: number; size: number; duration: number; delay: number; flap: number }

export function buildBirds(count = 6, seed = 5): Bird[] {
  const random = createRandom(seed)
  return Array.from({ length: count }, () => ({
    y: 6 + random() * 26,
    size: 8 + random() * 8,
    duration: Math.round(38 + random() * 30),
    delay: -Math.round(random() * 60),
    flap: Number((0.45 + random() * 0.35).toFixed(2)),
  }))
}
