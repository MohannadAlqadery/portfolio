/**
 * The hero's ASCII monogram: "MA" drawn into a character grid, the way an ASCII-art filter
 * renders a portrait. Pure data, so it's deterministic for a given seed and easy to test.
 */

export const GRID_COLS = 36
export const GRID_ROWS = 28

/** What a cell belongs to: background noise, the letters' shadow edge, or the letters. */
export const Cell = { Background: 0, Edge: 1, Letter: 2 } as const
export type Cell = (typeof Cell)[keyof typeof Cell]

/** Glyph pools per cell kind, densest for the letters. */
export const POOLS: Record<Cell, string> = {
  [Cell.Background]: '  ..··::',
  [Cell.Edge]: '+=*-',
  [Cell.Letter]: '#@%&$8',
}

/** Glyphs that flash through a cell while it "decrypts" or flickers. */
export const NOISE = '0123456789ABCDEF#$%&@*+=<>/\\'

// Condensed 13x18 bitmaps with 4-cell strokes, so the letters read clearly at small sizes.
const M = [
  '####.....####',
  '#####...#####',
  '######.######',
  '#############',
  '####.###.####',
  '####..#..####',
  '####.....####',
  '####.....####',
  '####.....####',
  '####.....####',
  '####.....####',
  '####.....####',
  '####.....####',
  '####.....####',
  '####.....####',
  '####.....####',
  '####.....####',
  '####.....####',
]

const A = [
  '....#####....',
  '...#######...',
  '..####.####..',
  '.####...####.',
  '####.....####',
  '####.....####',
  '####.....####',
  '####.....####',
  '####.....####',
  '#############',
  '#############',
  '####.....####',
  '####.....####',
  '####.....####',
  '####.....####',
  '####.....####',
  '####.....####',
  '####.....####',
]

const LETTER_GAP = 3

/** Small deterministic PRNG (mulberry32), so a seed always draws the same card. */
export function createRandom(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export const pick = (pool: string, random: () => number): string =>
  pool[Math.floor(random() * pool.length)] ?? ' '

/** Cell kinds for the whole grid: letters centred, with a one-cell shadow to the lower right. */
export function buildCells(): Cell[][] {
  const cells: Cell[][] = Array.from({ length: GRID_ROWS }, () =>
    Array.from({ length: GRID_COLS }, () => Cell.Background),
  )
  const width = (M[0]?.length ?? 0) * 2 + LETTER_GAP
  const left = Math.floor((GRID_COLS - width) / 2)
  const top = Math.floor((GRID_ROWS - M.length) / 2)

  const stamp = (bitmap: string[], x0: number) =>
    bitmap.forEach((line, y) =>
      Array.from(line).forEach((px, x) => {
        if (px !== '#') return
        const row = cells[top + y]
        if (row) row[x0 + x] = Cell.Letter
      }),
    )
  stamp(M, left)
  stamp(A, left + (M[0]?.length ?? 0) + LETTER_GAP)

  // Shadow: background cells just right of or below a letter cell.
  for (let y = 0; y < GRID_ROWS; y++) {
    for (let x = 0; x < GRID_COLS; x++) {
      if (cells[y]?.[x] !== Cell.Background) continue
      const leftIsLetter = cells[y]?.[x - 1] === Cell.Letter
      const aboveIsLetter = cells[y - 1]?.[x] === Cell.Letter
      if (leftIsLetter || aboveIsLetter) (cells[y] as Cell[])[x] = Cell.Edge
    }
  }
  return cells
}

/** The settled glyph for every cell. */
export function buildGlyphs(cells: Cell[][], random: () => number): string[][] {
  return cells.map((row) => row.map((kind) => pick(POOLS[kind], random)))
}

/**
 * Splits glyphs into one text layer per cell kind (other cells become spaces), so each layer
 * can be coloured separately while staying perfectly aligned in a monospace grid.
 */
export function toLayers(cells: Cell[][], glyphs: string[][]): Record<Cell, string> {
  const layer = (kind: Cell) =>
    cells
      .map((row, y) => row.map((k, x) => (k === kind ? (glyphs[y]?.[x] ?? ' ') : ' ')).join(''))
      .join('\n')
  return {
    [Cell.Background]: layer(Cell.Background),
    [Cell.Edge]: layer(Cell.Edge),
    [Cell.Letter]: layer(Cell.Letter),
  }
}
