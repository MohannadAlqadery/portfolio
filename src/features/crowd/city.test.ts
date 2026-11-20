import { describe, expect, it } from 'vitest'
import { buildBirds, buildSkyline, SKY_H, SKY_W, topOf } from './city'

describe('footer city', () => {
  const skyline = buildSkyline()

  it('is the same drawing every time', () => {
    expect(buildSkyline()).toEqual(skyline)
    expect(buildBirds()).toEqual(buildBirds())
  })

  it('spans the whole width with one dome and one crane near the middle', () => {
    expect(Math.min(...skyline.map((b) => b.x))).toBeLessThanOrEqual(0)
    expect(Math.max(...skyline.map((b) => b.x + b.w))).toBeGreaterThanOrEqual(SKY_W)
    const dome = skyline.filter((b) => b.kind === 'dome')
    const crane = skyline.filter((b) => b.kind === 'crane')
    expect(dome).toHaveLength(1)
    expect(crane).toHaveLength(1)
    for (const landmark of [...dome, ...crane]) {
      expect(landmark.x).toBeGreaterThan(SKY_W * 0.2)
      expect(landmark.x).toBeLessThan(SKY_W * 0.8)
    }
  })

  it('keeps every building, roof piece and mast inside the drawing', () => {
    for (const seed of [21, 1, 2, 3, 99]) {
      for (const b of buildSkyline(seed)) {
        expect(b.h).toBeGreaterThan(0)
        expect(topOf(b)).toBeLessThanOrEqual(SKY_H - 8)
      }
    }
  })

  it('flies birds in the upper sky', () => {
    for (const bird of buildBirds()) {
      expect(bird.y).toBeGreaterThanOrEqual(0)
      expect(bird.y).toBeLessThan(40)
      expect(bird.delay).toBeLessThanOrEqual(0)
    }
  })
})
