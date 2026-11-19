/**
 * Night-shift city: an Abu Dhabi-style skyline at night along the Corniche, where every building
 * is a host on the network. No real landmarks: the place comes through in the shapes (slim glass
 * towers with pyramid crowns, needle spires and setbacks, low-rise blocks between them), the date
 * palms along the promenade and the water in front.
 *
 * Pure, deterministic generation (seeded), so the same size always draws the same city and the
 * layout can be unit-tested without a canvas.
 */

export type Window = { col: number; row: number }
export type Shape = 'block' | 'rounded' | 'crown' | 'spire' | 'setback'

export type Building = {
  /** Leftmost column (inclusive). */
  x: number
  /** Width in columns. */
  w: number
  /** Height in rows, top of the outline included. */
  h: number
  /** Row of the topmost line of the outline. */
  roof: number
  shape: Shape
  /** Outline, rows top to bottom, each exactly `w` wide; spaces are see-through. */
  sprite: string[]
  host: string
  role: string
  windows: Window[]
  /** Aviation light on tall towers. */
  light?: Window
}

export type Star = { col: number; row: number; phase: number }

export type City = {
  cols: number
  rows: number
  /** Last row buildings stand on; the rows below are the Corniche's water. */
  ground: number
  buildings: Building[]
  /** Date palms along the promenade: the centre column of each (3 wide, 3 tall). */
  palms: number[]
  stars: Star[]
}

/** Small, fast, seedable PRNG (mulberry32). Returns floats in [0, 1). */
export function seeded(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** A date palm, 3 wide and 3 tall, standing on the promenade. */
export const PALM = ['╲│╱', ' │ ', ' │ '] as const

const WORKSTATION_ROLES = ['Finance', 'HR', 'Engineering', 'Sales', 'Legal', 'Front desk']
const SERVER_ROLES = [
  'Domain controller',
  'File server',
  'Mail gateway',
  'SIEM collector',
  'Web app',
]

type Outline = { sprite: string[]; windows: Window[]; light?: Window }

const blankRow = (w: number) => Array.from({ length: w }, () => ' ')
const wall = (w: number, inset = 0) => {
  const r = blankRow(w)
  r[inset] = '│'
  r[w - 1 - inset] = '│'
  return r
}
const lid = (w: number, inset = 0, round = false) => {
  const r = blankRow(w)
  for (let c = inset + 1; c < w - 1 - inset; c++) r[c] = '─'
  r[inset] = round ? '╭' : '┌'
  r[w - 1 - inset] = round ? '╮' : '┐'
  return r
}

/** Windows on every other row and column between the walls, starting `from` rows down. */
function windowsIn(rows: string[][], from: number): Window[] {
  const out: Window[] = []
  for (let r = from; r < rows.length; r += 2) {
    const line = rows[r]
    if (!line) continue
    const left = line.indexOf('│')
    const right = line.lastIndexOf('│')
    if (left < 0 || right - left < 2) continue
    for (let c = left + 1; c < right; c += 2) out.push({ col: c, row: r })
  }
  return out
}

function outline(shape: Shape, w: number, h: number): Outline {
  const rows: string[][] = []
  let first = 2
  let light: Window | undefined

  if (shape === 'crown') {
    // Pyramid crown on a slim glass tower.
    const peak = w / 2 - 1
    for (let i = 0; i < peak; i++) {
      const r = blankRow(w)
      r[peak - i] = '╱'
      r[peak + 1 + i] = '╲'
      rows.push(r)
    }
    rows.push(lid(w))
    first = rows.length + 1
    light = { col: peak, row: -1 }
  } else if (shape === 'spire') {
    // Needle spire above a flat top.
    const mid = Math.floor(w / 2)
    for (let i = 0; i < 2; i++) {
      const r = blankRow(w)
      r[mid] = '│'
      rows.push(r)
    }
    rows.push(lid(w))
    first = rows.length + 1
    light = { col: mid, row: -1 }
  } else if (shape === 'setback') {
    // A narrower upper block stepped back from the base.
    const upper = Math.max(2, Math.round(h * 0.38))
    rows.push(lid(w, 1))
    for (let i = 1; i < upper; i++) rows.push(wall(w, 1))
    const step = blankRow(w)
    step[0] = '┌'
    step[1] = '┘'
    step[w - 2] = '└'
    step[w - 1] = '┐'
    rows.push(step)
    light = { col: Math.floor(w / 2), row: -1 }
  } else {
    rows.push(lid(w, 0, shape === 'rounded'))
  }
  while (rows.length < h) rows.push(wall(w))

  const windows = windowsIn(rows, first).filter((win) => rows[win.row]?.[win.col] === ' ')
  return { sprite: rows.map((r) => r.join('')), windows, ...(light ? { light } : {}) }
}

/**
 * Builds a skyline that fills `cols` × `rows`: buildings shoulder to shoulder (sometimes an alley)
 * standing on the promenade, palms in front, water along the bottom and sky above with room for
 * spires, lights and alert markers.
 */
export function generateCity(cols: number, rows: number, seed = 2608): City {
  const rand = seeded(seed + cols * 31 + rows)
  const pick = <T>(list: readonly T[]): T => list[Math.floor(rand() * list.length)] as T
  const water = rows >= 18 ? 3 : 2
  const ground = rows - water - 1
  const maxH = Math.max(ground + 1 - 3, 5)
  const narrow = cols < 80
  const buildings: Building[] = []
  const usedHosts = new Set<string>()

  let x = rand() < 0.5 ? 1 : 0
  while (x <= cols - 3) {
    let w = Math.min(narrow ? 3 + Math.floor(rand() * 4) : 4 + Math.floor(rand() * 5), cols - x)
    if (cols - x - w > 0 && cols - x - w < 3) w = cols - x

    // About a third are tall towers, as along the Corniche; the rest mid- and low-rise.
    const tall = rand() < 0.36
    const share = tall ? 0.68 + rand() * 0.32 : 0.28 + rand() * 0.36
    const h = Math.max(4, Math.min(maxH, Math.round(maxH * share)))

    let shape: Shape = rand() < 0.3 ? 'rounded' : 'block'
    if (tall) {
      const options: Shape[] = ['spire', 'rounded', 'block']
      if (w % 2 === 0 && w >= 4) options.push('crown', 'crown')
      if (w >= 5) options.push('setback', 'setback')
      shape = pick(options)
    }

    const { sprite, windows, light } = outline(shape, w, h)
    const roof = ground + 1 - h

    let host: string
    do {
      const n = Math.floor(rand() * 9000) + 1000
      host = tall ? `SRV-ADH-${n.toString().slice(0, 2)}` : `WS-ADH-${n}`
    } while (usedHosts.has(host))
    usedHosts.add(host)

    buildings.push({
      x,
      w,
      h,
      roof,
      shape,
      sprite,
      host,
      role: tall ? pick(SERVER_ROLES) : pick(WORKSTATION_ROLES),
      windows: windows.map((win) => ({ col: x + win.col, row: roof + win.row })),
      ...(tall && light ? { light: { col: x + light.col, row: roof + light.row } } : {}),
    })

    x += w + (rand() < 0.28 ? 1 : 0)
  }

  // Date palms along the promenade, spaced out, in front of the buildings.
  const palms: number[] = []
  for (let col = 2 + Math.floor(rand() * 4); col <= cols - 2; col += 8 + Math.floor(rand() * 7)) {
    palms.push(col)
  }

  // A sparse sky, kept clear of rooftops, spires and lights.
  const stars: Star[] = []
  const starCount = Math.round(cols * 0.35)
  for (let i = 0; i < starCount; i++) {
    const col = Math.floor(rand() * cols)
    const top = buildings.find((b) => col >= b.x && col < b.x + b.w)?.roof ?? ground + 1
    const limit = Math.max(top - 3, 0)
    if (limit <= 0) continue
    stars.push({ col, row: Math.floor(rand() * limit), phase: rand() * Math.PI * 2 })
  }

  return { cols, rows, ground, buildings, palms, stars }
}

/**
 * The host under a grid cell. The tap target is generous: it includes the two rows above the
 * outline (spire, light, alert marker) and the building's reflection in the water below.
 */
export function buildingAt(city: City, col: number, row: number): number | null {
  const index = city.buildings.findIndex(
    (b) => col >= b.x && col < b.x + b.w && row >= b.roof - 2 && row < city.rows,
  )
  return index === -1 ? null : index
}
