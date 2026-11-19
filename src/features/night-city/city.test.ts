import { describe, expect, it } from 'vitest'
import { alertTemplates } from './alerts'
import { buildingAt, generateCity, seeded } from './city'

describe('night-shift city', () => {
  it('is deterministic for a given size', () => {
    expect(generateCity(80, 18)).toEqual(generateCity(80, 18))
    expect(seeded(1)()).toBe(seeded(1)())
  })

  it.each([
    [40, 14],
    [57, 16],
    [166, 20],
  ])('fits a %i × %i grid without overlaps', (cols, rows) => {
    const city = generateCity(cols, rows)
    expect(city.buildings.length).toBeGreaterThan(3)

    let lastRight = -1
    for (const b of city.buildings) {
      // Inside the grid, standing on the bottom row, with sky above for antennas and markers.
      expect(b.x).toBeGreaterThan(lastRight)
      expect(b.x + b.w).toBeLessThanOrEqual(cols)
      expect(b.roof + b.h).toBe(rows)
      expect(b.roof).toBeGreaterThanOrEqual(2)
      lastRight = b.x + b.w - 1

      // Windows sit inside the walls and below the roof.
      for (const w of b.windows) {
        expect(w.col).toBeGreaterThan(b.x)
        expect(w.col).toBeLessThan(b.x + b.w - 1)
        expect(w.row).toBeGreaterThan(b.roof)
        expect(w.row).toBeLessThan(rows)
      }
    }

    // Every host has its own name, and stars stay above the rooftops.
    expect(new Set(city.buildings.map((b) => b.host)).size).toBe(city.buildings.length)
    for (const star of city.stars) {
      const roof = city.buildings.find((b) => star.col >= b.x && star.col < b.x + b.w)?.roof ?? rows
      expect(star.row).toBeLessThan(roof - 2)
    }
  })

  it('finds the building under a cell, including just above its roof', () => {
    const city = generateCity(80, 18)
    const b = city.buildings[2]
    if (!b) throw new Error('expected buildings')
    expect(buildingAt(city, b.x, city.rows - 1)).toBe(2)
    expect(buildingAt(city, b.x, b.roof - 2)).toBe(2)
    expect(buildingAt(city, b.x, b.roof - 3)).toBeNull()
  })
})

describe('alert catalogue', () => {
  it('has well-formed, varied cases', () => {
    expect(alertTemplates.length).toBeGreaterThanOrEqual(6)
    for (const a of alertTemplates) {
      expect(a.technique).toMatch(/^T\d{4}(\.\d{3})?$/)
      expect(a.steps).toHaveLength(3)
      expect(a.outcome.length).toBeGreaterThan(10)
    }
    // A mix of outcomes, like a real shift: not everything is an incident.
    const verdicts = new Set(alertTemplates.map((a) => a.verdict))
    expect(verdicts).toEqual(new Set(['escalated', 'benign', 'false-positive']))
  })
})
