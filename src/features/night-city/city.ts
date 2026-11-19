/**
 * Night-shift city: a skyline where every building is a host on the network.
 * Pure, deterministic generation (seeded), so the same width always draws the same city and the
 * layout can be unit-tested without a canvas.
 */

export type Window = { col: number; row: number }

export type Building = {
  /** Leftmost column (inclusive). */
  x: number
  /** Width in columns, walls included. */
  w: number
  /** Height in rows, roof included. */
  h: number
  /** Row of the roof line (rows count down from the top of the grid). */
  roof: number
  host: string
  role: string
  /** Tall towers carry an antenna with an aviation light. */
  tower: boolean
  windows: Window[]
}

export type Star = { col: number; row: number; phase: number }

export type City = { cols: number; rows: number; buildings: Building[]; stars: Star[] }

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

const WORKSTATION_ROLES = ['Finance', 'HR', 'Engineering', 'Sales', 'Legal', 'Front desk']
const SERVER_ROLES = [
  'Domain controller',
  'File server',
  'Mail gateway',
  'SIEM collector',
  'Web app',
]

/**
 * Builds a skyline that fills `cols` × `rows`. Buildings sit on the bottom row, never overlap,
 * and keep at least two rows of sky above the tallest roof for antennas and alert markers.
 */
export function generateCity(cols: number, rows: number, seed = 2608): City {
  const rand = seeded(seed + cols * 31 + rows)
  const pick = <T>(list: readonly T[]): T => list[Math.floor(rand() * list.length)] as T
  const buildings: Building[] = []
  const maxH = Math.max(rows - 3, 4)
  const usedHosts = new Set<string>()

  let x = rand() < 0.5 ? 1 : 0
  while (x < cols - 2) {
    // Slimmer buildings on narrow screens, so a phone still gets a proper skyline.
    const w = Math.min(
      cols < 80 ? 3 + Math.floor(rand() * 4) : 4 + Math.floor(rand() * 6),
      cols - x,
    )
    if (w < 3) break

    const tower = rand() < 0.16 && w >= 5
    const share = tower ? 0.72 + rand() * 0.28 : 0.28 + rand() * 0.4
    const h = Math.max(4, Math.min(maxH, Math.round(maxH * share)))
    const roof = rows - h

    // Windows on every other column and every other row, inside the walls and below the roof.
    const windows: Window[] = []
    for (let row = roof + 2; row <= rows - 2; row += 2) {
      for (let col = x + 1; col <= x + w - 2; col += 2) windows.push({ col, row })
    }

    let host: string
    do {
      const n = Math.floor(rand() * 9000) + 1000
      host = tower ? `SRV-ADH-${n.toString().slice(0, 2)}` : `WS-ADH-${n}`
    } while (usedHosts.has(host))
    usedHosts.add(host)

    buildings.push({
      x,
      w,
      h,
      roof,
      host,
      role: tower ? pick(SERVER_ROLES) : pick(WORKSTATION_ROLES),
      tower,
      windows,
    })

    // Mostly shoulder to shoulder, sometimes an alley.
    x += w + (rand() < 0.3 ? 1 : 0)
  }

  // A sparse sky, kept clear of rooftops.
  const stars: Star[] = []
  const starCount = Math.round(cols * 0.35)
  for (let i = 0; i < starCount; i++) {
    const col = Math.floor(rand() * cols)
    const top = buildings.find((b) => col >= b.x && col < b.x + b.w)?.roof ?? rows
    const limit = Math.max(top - 3, 0)
    if (limit <= 0) continue
    stars.push({ col, row: Math.floor(rand() * limit), phase: rand() * Math.PI * 2 })
  }

  return { cols, rows, buildings, stars }
}

/** The building under a grid cell, counting the two rows above a roof (antennas, markers). */
export function buildingAt(city: City, col: number, row: number): number | null {
  const index = city.buildings.findIndex(
    (b) => col >= b.x && col < b.x + b.w && row >= b.roof - 2 && row < city.rows,
  )
  return index === -1 ? null : index
}
