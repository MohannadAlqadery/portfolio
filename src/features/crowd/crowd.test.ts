import { describe, expect, it } from 'vitest'
import { createRandom } from '@/lib/random'
import { buildCrowd, nextDetection } from './crowd'

describe('buildCrowd', () => {
  const crowd = buildCrowd(24, 18)

  it('is the same crowd for the same seed', () => {
    expect(buildCrowd(24, 18)).toEqual(crowd)
  })

  it('spreads walkers over three rows and every figure', () => {
    for (const row of [0, 1, 2]) expect(crowd.filter((w) => w.row === row)).toHaveLength(8)
    expect(new Set(crowd.map((w) => w.peep)).size).toBe(18)
  })

  it('starts everyone part-way across, so the band is never empty', () => {
    for (const w of crowd) {
      expect(w.delay).toBeLessThanOrEqual(0)
      expect(-w.delay).toBeLessThanOrEqual(w.duration)
    }
  })

  it('makes back rows slower than the front (parallax)', () => {
    const average = (row: number) => {
      const lane = crowd.filter((w) => w.row === row)
      return lane.reduce((sum, w) => sum + w.duration, 0) / lane.length
    }
    expect(average(0)).toBeGreaterThan(average(2))
  })

  it('keeps half the walkers for wide screens', () => {
    expect(crowd.filter((w) => w.wideOnly)).toHaveLength(12)
  })
})

describe('nextDetection', () => {
  it('picks one of the given walkers and labels it by kind', () => {
    const random = createRandom(5)
    const all = Array.from({ length: 200 }, (_, key) => nextDetection(key, [3, 7, 9], random))
    expect(all.every((d) => [3, 7, 9].includes(d.walker) && !d.triaged)).toBe(true)
    expect(new Set(all.map((d) => d.kind))).toEqual(new Set(['benign', 'user', 'anomaly']))
    const labels = (kind: string) => all.filter((d) => d.kind === kind).map((d) => d.label)
    expect(labels('anomaly').every((label) => /^anomaly 0[.][0-9]{2}$/.test(label))).toBe(true)
    expect(new Set(labels('user'))).toEqual(new Set(['verified user']))
  })
})
