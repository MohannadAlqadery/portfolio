import { describe, expect, it } from 'vitest'
import {
  buildCells,
  buildGlyphs,
  Cell,
  createRandom,
  GRID_COLS,
  GRID_ROWS,
  POOLS,
  toLayers,
} from './monogram'

describe('ASCII monogram', () => {
  const cells = buildCells()

  it('fills the whole grid', () => {
    expect(cells).toHaveLength(GRID_ROWS)
    for (const row of cells) expect(row).toHaveLength(GRID_COLS)
  })

  it('centres the letters horizontally', () => {
    const letterCols = cells.flatMap((row) =>
      row.flatMap((kind, x) => (kind === Cell.Letter ? [x] : [])),
    )
    const left = Math.min(...letterCols)
    const right = GRID_COLS - 1 - Math.max(...letterCols)
    expect(Math.abs(left - right)).toBeLessThanOrEqual(1)
  })

  it('draws a shadow edge next to the letters', () => {
    expect(cells.flat().filter((k) => k === Cell.Edge).length).toBeGreaterThan(20)
  })

  it('is the same card for the same seed, and uses each kind’s glyph pool', () => {
    const a = buildGlyphs(cells, createRandom(3))
    expect(buildGlyphs(cells, createRandom(3))).toEqual(a)
    cells.forEach((row, y) => row.forEach((kind, x) => expect(POOLS[kind]).toContain(a[y]?.[x])))
  })

  it('splits into aligned layers of equal shape', () => {
    const layers = toLayers(cells, buildGlyphs(cells, createRandom(1)))
    for (const text of Object.values(layers)) {
      const lines = text.split('\n')
      expect(lines).toHaveLength(GRID_ROWS)
      for (const line of lines) expect(line).toHaveLength(GRID_COLS)
    }
    // Only letter cells show up in the letter layer.
    const letterLine = layers[Cell.Letter].split('\n')[Math.floor(GRID_ROWS / 2)] ?? ''
    expect(letterLine.trim().length).toBeGreaterThan(0)
  })
})
