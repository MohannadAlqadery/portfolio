import { describe, expect, it } from 'vitest'
import { alertTemplates } from './alerts'
import { buildingAt, generateCity, seeded } from './city'

describe('night-shift city', () => {
  it('is deterministic for a given size', () => {
    expect(generateCity(80, 18)).toEqual(generateCity(80, 18))
    expect(seeded(1)()).toBe(seeded(1)())
  })

  it.each([
    // 320px-wide phone (the narrowest in use), then a typical phone, then wider screens.
    [48, 14],
    [57, 16],
    [120, 19],
    [166, 20],
  ])('fits a %i × %i grid without overlaps', (cols, rows) => {
    const city = generateCity(cols, rows)
    expect(city.buildings.filter((b) => !b.landmark).length).toBeGreaterThan(3)
    // Water along the bottom: the Corniche.
    expect(city.ground).toBeLessThan(rows - 1)

    let lastRight = -1
    for (const b of city.buildings) {
      // Inside the grid, standing on the ground row, with sky above for antennas and markers.
      expect(b.x).toBeGreaterThan(lastRight)
      expect(b.x + b.w).toBeLessThanOrEqual(cols)
      expect(b.roof + b.h).toBe(city.ground + 1)
      expect(b.roof).toBeGreaterThanOrEqual(2)
      lastRight = b.x + b.w - 1

      // Hand-drawn landmarks are exactly as wide and tall as their footprint.
      for (const line of b.sprite ?? []) expect([...line]).toHaveLength(b.w)
      expect(b.sprite?.length ?? b.h).toBe(b.h)

      // Windows sit inside the outline.
      for (const w of b.windows) {
        expect(w.col).toBeGreaterThanOrEqual(b.x)
        expect(w.col).toBeLessThan(b.x + b.w)
        expect(w.row).toBeGreaterThan(b.roof)
        expect(w.row).toBeLessThanOrEqual(city.ground)
      }
    }

    // Every host has its own name, and stars stay above the rooftops.
    const hosts = city.buildings.filter((b) => !b.landmark).map((b) => b.host)
    expect(new Set(hosts).size).toBe(hosts.length)
    for (const star of city.stars) {
      const roof =
        city.buildings.find((b) => star.col >= b.x && star.col < b.x + b.w)?.roof ?? city.ground + 1
      expect(star.row).toBeLessThan(roof - 2)
    }
  })

  it('shows Abu Dhabi landmarks, labelled, with the Grand Mosque on wider screens', () => {
    const phone = generateCity(57, 16)
    const desktop = generateCity(166, 20)
    const names = (c: typeof phone) => [...new Set(c.buildings.flatMap((b) => b.landmark ?? []))]
    expect(names(phone)).toEqual(['Etihad Towers', 'ADNOC HQ', 'Aldar HQ'])
    expect(names(desktop)).toEqual(['Etihad Towers', 'ADNOC HQ', 'Aldar HQ', 'Grand Mosque'])
    expect(desktop.labels.map((l) => l.text)).toEqual([
      'ETIHAD TOWERS',
      'ADNOC HQ',
      'ALDAR HQ',
      'GRAND MOSQUE',
    ])
    // Labels stay on screen and don't run into each other.
    for (const city of [phone, desktop]) {
      let lastEnd = -1
      for (const label of city.labels) {
        const start = Math.round(label.col - label.text.length / 2)
        expect(start).toBeGreaterThan(lastEnd)
        lastEnd = start + label.text.length
        expect(lastEnd).toBeLessThanOrEqual(city.cols)
      }
    }
  })

  it('treats landmarks as scenery: only ordinary buildings are hosts you can pick', () => {
    const city = generateCity(166, 20)
    const landmark = city.buildings.find((b) => b.landmark)
    const host = city.buildings.findIndex((b) => !b.landmark)
    const hostB = city.buildings[host]
    if (!landmark || !hostB) throw new Error('expected both')
    expect(buildingAt(city, landmark.x + 1, city.ground)).toBeNull()
    expect(buildingAt(city, hostB.x, city.ground)).toBe(host)
    expect(buildingAt(city, hostB.x, hostB.roof - 2)).toBe(host)
    expect(buildingAt(city, hostB.x, hostB.roof - 3)).toBeNull()
    // Its reflection in the water counts too (a bigger tap target), but not off the grid.
    expect(buildingAt(city, hostB.x, city.rows - 1)).toBe(host)
    expect(buildingAt(city, hostB.x, city.rows)).toBeNull()
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
