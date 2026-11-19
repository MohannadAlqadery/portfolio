/**
 * Night-shift city: Abu Dhabi's skyline at night, where every ordinary building is a host on the
 * network and a few real landmarks make the place recognisable. Pure, deterministic generation
 * (seeded), so the same width always draws the same city and the layout is unit-testable.
 *
 * Landmarks are scenery only: they never raise alerts or open a host card, so the site never
 * suggests that a real organisation or place had a security incident.
 */

export type Window = { col: number; row: number }

export type Building = {
  /** Leftmost column (inclusive). */
  x: number
  /** Width in columns. */
  w: number
  /** Height in rows, roof included. */
  h: number
  /** Row of the topmost line of the building. */
  roof: number
  /** Ordinary buildings: the host's name and role. Empty for landmarks. */
  host: string
  role: string
  /** Generic towers carry an antenna with an aviation light. */
  tower: boolean
  roofStyle: 'flat' | 'round'
  /** Landmark name: scenery, not a host. */
  landmark?: string
  /** Hand-drawn outline (rows top to bottom, each `w` wide; spaces are see-through). */
  sprite?: readonly string[]
  /** Drawn brighter (lit at night). */
  bright?: boolean
  windows: Window[]
}

export type Star = { col: number; row: number; phase: number }
export type Label = { text: string; col: number }

export type City = {
  cols: number
  rows: number
  /** Last row buildings stand on; rows below it are the Corniche's water. */
  ground: number
  buildings: Building[]
  stars: Star[]
  /** Landmark names, centred under each landmark at the waterline. */
  labels: Label[]
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

const WORKSTATION_ROLES = ['Finance', 'HR', 'Engineering', 'Sales', 'Legal', 'Front desk']
const SERVER_ROLES = [
  'Domain controller',
  'File server',
  'Mail gateway',
  'SIEM collector',
  'Web app',
]

/** Aldar HQ: the round, coin-shaped tower, on its podium. */
const ALDAR = [
  '   ╭───╮   ',
  ' ╭╯     ╰╮ ',
  '│         │',
  '│         │',
  ' ╰╮     ╭╯ ',
  '   ╰─┬─╯   ',
  '  ┌──┴──┐  ',
  '  │     │  ',
] as const
const ALDAR_WINDOWS: Window[] = [
  { col: 4, row: 1 },
  { col: 6, row: 1 },
  ...[2, 4, 6, 8].flatMap((col) => [
    { col, row: 2 },
    { col, row: 3 },
  ]),
  { col: 4, row: 4 },
  { col: 6, row: 4 },
  { col: 4, row: 7 },
  { col: 6, row: 7 },
]

/** Sheikh Zayed Grand Mosque: four minarets, the main dome and its smaller domes, the arcade. */
const MOSQUE = [
  ' ▴             ▴ ',
  ' │      ▴      │ ',
  ' │     ╭─╮     │ ',
  ' │   ╭─╯ ╰─╮   │ ',
  ' │ ╭╮│     │╭╮ │ ',
  ' │┌┴┴┴─────┴┴┴┐│ ',
  ' ││           ││ ',
  '─┴┴───────────┴┴─',
] as const
const MOSQUE_WINDOWS: Window[] = [
  { col: 7, row: 4 },
  { col: 9, row: 4 },
  ...[4, 6, 8, 10, 12].map((col) => ({ col, row: 6 })),
]

type Landmark = { name: string; width: number; build: (x: number) => Omit<Building, 'roof'>[] }

function landmarks(
  maxH: number,
  size: 'wide' | 'phone' | 'narrow',
): { at: number; landmark: Landmark }[] {
  const scenery = { host: '', role: '', tower: false } as const
  const etihad: Landmark = {
    name: 'Etihad Towers',
    width: 11,
    // Three slim towers with rounded tops, stepped heights.
    build: (x) =>
      [0.8, 0.95, 0.86].map((share, i) => {
        const h = Math.max(6, Math.round(maxH * share))
        return {
          ...scenery,
          x: x + i * 4,
          w: 3,
          h,
          roofStyle: 'round' as const,
          landmark: 'Etihad Towers',
          windows: Array.from({ length: Math.floor((h - 2) / 2) }, (_, k) => ({
            col: 1,
            row: 2 + k * 2,
          })),
        }
      }),
  }
  const adnoc: Landmark = {
    name: 'ADNOC HQ',
    width: 5,
    // The tallest, slimmest tower, lit floor by floor.
    build: (x) => [
      {
        ...scenery,
        x,
        w: 5,
        h: maxH,
        roofStyle: 'flat' as const,
        landmark: 'ADNOC HQ',
        windows: Array.from({ length: maxH - 2 }, (_, k) => [
          { col: 1, row: 1 + k },
          { col: 3, row: 1 + k },
        ]).flat(),
      },
    ],
  }
  const aldar: Landmark = {
    name: 'Aldar HQ',
    width: ALDAR[0].length,
    build: (x) => [
      {
        ...scenery,
        x,
        w: ALDAR[0].length,
        h: ALDAR.length,
        roofStyle: 'flat' as const,
        landmark: 'Aldar HQ',
        sprite: ALDAR,
        windows: ALDAR_WINDOWS,
      },
    ],
  }
  const mosque: Landmark = {
    name: 'Grand Mosque',
    width: MOSQUE[0].length,
    build: (x) => [
      {
        ...scenery,
        x,
        w: MOSQUE[0].length,
        h: MOSQUE.length,
        roofStyle: 'flat' as const,
        landmark: 'Grand Mosque',
        sprite: MOSQUE,
        bright: true,
        windows: MOSQUE_WINDOWS,
      },
    ],
  }
  if (size === 'wide') {
    return [
      { at: 0.12, landmark: etihad },
      { at: 0.42, landmark: adnoc },
      { at: 0.63, landmark: aldar },
      { at: 0.86, landmark: mosque },
    ]
  }
  if (size === 'phone') {
    return [
      { at: 0.17, landmark: etihad },
      { at: 0.5, landmark: adnoc },
      { at: 0.8, landmark: aldar },
    ]
  }
  // Very narrow (small phones): two landmarks at the edges, hosts in between.
  return [
    { at: 0.14, landmark: etihad },
    { at: 0.86, landmark: aldar },
  ]
}

/**
 * Builds a skyline that fills `cols` × `rows`: landmarks at fixed positions, ordinary buildings
 * (hosts) in between, water along the bottom, and sky above with room for antennas and markers.
 */
export function generateCity(cols: number, rows: number, seed = 2608): City {
  const rand = seeded(seed + cols * 31 + rows)
  const pick = <T>(list: readonly T[]): T => list[Math.floor(rand() * list.length)] as T
  const water = rows >= 15 ? 2 : 1
  const ground = rows - water - 1
  const maxH = Math.max(ground + 1 - 3, 4)
  const narrow = cols < 80
  const buildings: Building[] = []
  const labels: Label[] = []
  const usedHosts = new Set<string>()

  const place = (b: Omit<Building, 'roof'>) => {
    // Relative window positions → grid positions.
    const roof = ground + 1 - b.h
    buildings.push({
      ...b,
      roof,
      windows: b.windows.map((w) => ({ col: b.x + w.col, row: roof + w.row })),
    })
  }

  const block = (x: number, w: number) => {
    const tower = rand() < 0.16 && w >= 5
    const share = tower ? 0.62 + rand() * 0.25 : 0.25 + rand() * 0.4
    const h = Math.max(4, Math.min(maxH - 1, Math.round(maxH * share)))
    const windows: Window[] = []
    for (let row = 2; row <= h - 1; row += 2) {
      for (let col = 1; col <= w - 2; col += 2) windows.push({ col, row })
    }
    let host: string
    do {
      const n = Math.floor(rand() * 9000) + 1000
      host = tower ? `SRV-ADH-${n.toString().slice(0, 2)}` : `WS-ADH-${n}`
    } while (usedHosts.has(host))
    usedHosts.add(host)
    place({
      x,
      w,
      h,
      host,
      role: tower ? pick(SERVER_ROLES) : pick(WORKSTATION_ROLES),
      tower,
      roofStyle: 'flat',
      windows,
    })
  }

  /** Ordinary buildings across [from, to], mostly shoulder to shoulder, sometimes an alley. */
  const fill = (from: number, to: number) => {
    let x = from
    while (to - x + 1 >= 3) {
      const left = to - x + 1
      let w = Math.min(narrow ? 3 + Math.floor(rand() * 4) : 4 + Math.floor(rand() * 6), left)
      if (left - w > 0 && left - w < 3) w = left
      block(x, w)
      x += w + (rand() < 0.3 ? 1 : 0)
    }
  }

  let cursor = rand() < 0.5 ? 1 : 0
  const size = cols >= 100 ? 'wide' : cols >= 52 ? 'phone' : 'narrow'
  for (const { at, landmark } of landmarks(maxH, size)) {
    if (landmark.width > cols - cursor) break
    const start = Math.min(
      Math.max(Math.round(cols * at - landmark.width / 2), cursor),
      cols - landmark.width,
    )
    const parts = landmark.build(start)
    // Too short a canvas for this landmark: leave the space to ordinary buildings.
    if (parts.some((b) => b.h > maxH)) continue
    fill(cursor, start - 2)
    for (const b of parts) place(b)
    labels.push({ text: landmark.name.toUpperCase(), col: start + landmark.width / 2 })
    cursor = start + landmark.width + 1
  }
  fill(cursor, cols - 1)
  buildings.sort((a, b) => a.x - b.x)

  // A sparse sky, kept clear of rooftops.
  const stars: Star[] = []
  const starCount = Math.round(cols * 0.35)
  for (let i = 0; i < starCount; i++) {
    const col = Math.floor(rand() * cols)
    const top = buildings.find((b) => col >= b.x && col < b.x + b.w)?.roof ?? ground + 1
    const limit = Math.max(top - 3, 0)
    if (limit <= 0) continue
    stars.push({ col, row: Math.floor(rand() * limit), phase: rand() * Math.PI * 2 })
  }

  return { cols, rows, ground, buildings, stars, labels }
}

/**
 * The host under a grid cell. The tap target is generous: it includes the two rows above the roof
 * (antenna, alert marker) and the building's reflection in the water below.
 * Landmarks are scenery, so they never count.
 */
export function buildingAt(city: City, col: number, row: number): number | null {
  const index = city.buildings.findIndex(
    (b) => !b.landmark && col >= b.x && col < b.x + b.w && row >= b.roof - 2 && row < city.rows,
  )
  return index === -1 ? null : index
}
