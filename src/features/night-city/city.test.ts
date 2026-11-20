import { describe, expect, it } from 'vitest'
import { alertTemplates, byUrgency, incidentTemplates } from './alerts'
import { buildingAt, generateCity, PALM, seeded } from './city'

describe('night-shift city', () => {
  it('is deterministic for a given size', () => {
    expect(generateCity(80, 18)).toEqual(generateCity(80, 18))
    expect(seeded(1)()).toBe(seeded(1)())
  })

  it.each([
    // 320px-wide phone (the narrowest in use), a typical phone, then wider screens.
    [48, 14],
    [57, 16],
    [120, 19],
    [166, 20],
  ])('fits a %i × %i grid without overlaps', (cols, rows) => {
    const city = generateCity(cols, rows)
    expect(city.buildings.length).toBeGreaterThan(5)
    // Water along the bottom: the Corniche.
    expect(city.ground).toBeLessThan(rows - 2)

    let lastRight = -1
    for (const b of city.buildings) {
      // Inside the grid and standing on the ground row.
      expect(b.x).toBeGreaterThan(lastRight)
      expect(b.x + b.w).toBeLessThanOrEqual(cols)
      expect(b.roof + b.h).toBe(city.ground + 1)
      lastRight = b.x + b.w - 1

      // The outline is exactly the building's footprint.
      expect(b.sprite).toHaveLength(b.h)
      for (const line of b.sprite) expect([...line]).toHaveLength(b.w)

      // Windows sit inside the outline, on empty cells.
      for (const w of b.windows) {
        expect(w.col).toBeGreaterThan(b.x)
        expect(w.col).toBeLessThan(b.x + b.w - 1)
        expect(w.row).toBeGreaterThan(b.roof)
        expect(w.row).toBeLessThanOrEqual(city.ground)
        expect(b.sprite[w.row - b.roof]?.[w.col - b.x]).toBe(' ')
      }

      // Aviation lights sit just above a tall building, still in the sky.
      expect(b.light?.row ?? b.roof - 1).toBe(b.roof - 1)
      expect(b.roof - 1).toBeGreaterThanOrEqual(0)
    }

    // Every host has its own name; palms stand on the promenade; stars stay above rooftops.
    const hosts = city.buildings.map((b) => b.host)
    expect(new Set(hosts).size).toBe(hosts.length)
    for (const col of city.palms) {
      expect(col).toBeGreaterThanOrEqual(1)
      expect(col).toBeLessThanOrEqual(cols - 2)
    }
    for (const star of city.stars) {
      const roof =
        city.buildings.find((b) => star.col >= b.x && star.col < b.x + b.w)?.roof ?? city.ground + 1
      expect(star.row).toBeLessThan(roof - 2)
    }
  })

  it('has an Abu Dhabi-style mix of towers: crowns, spires, setbacks and low-rise', () => {
    const city = generateCity(166, 20)
    const shapes = new Set(city.buildings.map((b) => b.shape))
    for (const shape of ['block', 'crown', 'spire', 'setback'] as const) {
      expect(shapes).toContain(shape)
    }
    expect(city.palms.length).toBeGreaterThan(5)
    expect(PALM.every((line) => [...line].length === 3)).toBe(true)
  })

  it('treats every building as a host, with a generous tap target', () => {
    const city = generateCity(166, 20)
    const host = 3
    const b = city.buildings[host]
    if (!b) throw new Error('expected buildings')
    expect(buildingAt(city, b.x, city.ground)).toBe(host)
    expect(buildingAt(city, b.x, b.roof - 2)).toBe(host)
    expect(buildingAt(city, b.x, b.roof - 3)).toBeNull()
    // Its reflection in the water counts too, but not off the grid.
    expect(buildingAt(city, b.x, city.rows - 1)).toBe(host)
    expect(buildingAt(city, b.x, city.rows)).toBeNull()
  })
})

describe('cases', () => {
  it('alerts and incidents are well-formed and varied', () => {
    for (const a of [...alertTemplates, ...incidentTemplates]) {
      expect(a.technique).toMatch(/^T\d{4}(\.\d{3})?$/)
      expect(a.steps).toHaveLength(3)
      expect(a.outcome.length).toBeGreaterThan(10)
    }
    // Alerts are one host; incidents span two or three.
    expect(alertTemplates.every((a) => a.hosts === undefined)).toBe(true)
    expect(incidentTemplates.every((a) => a.hosts === 2 || a.hosts === 3)).toBe(true)
    // A mix of outcomes, like a real shift: not everything is an incident or an escalation.
    const verdicts = new Set([...alertTemplates, ...incidentTemplates].map((a) => a.verdict))
    expect(verdicts).toEqual(new Set(['escalated', 'contained', 'benign', 'false-positive']))
  })

  it('triages the most urgent first', () => {
    const [low, critical, high] = [
      alertTemplates.find((a) => a.severity === 'low'),
      incidentTemplates.find((a) => a.severity === 'critical'),
      alertTemplates.find((a) => a.severity === 'high'),
    ]
    if (!low || !critical || !high) throw new Error('expected templates')
    const queue = [
      { template: low, openedAt: 1 },
      { template: high, openedAt: 3 },
      { template: critical, openedAt: 2 },
      { template: high, openedAt: 2 },
    ].sort(byUrgency)
    expect(queue.map((q) => [q.template.severity, q.openedAt])).toEqual([
      ['critical', 2],
      ['high', 2],
      ['high', 3],
      ['low', 1],
    ])
  })
})
