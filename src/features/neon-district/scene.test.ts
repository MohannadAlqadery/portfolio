import { describe, expect, it } from 'vitest'
import {
  buildShops,
  buildTowers,
  buildWalkers,
  NEON,
  signOn,
  stride,
  trainX,
  walkerX,
  type Sign,
} from './scene'

/** Rough hue check: anything between yellow-green and teal counts as "green". */
function isGreenish(hex: string) {
  const n = parseInt(hex.slice(1), 16)
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => v / 255) as [
    number,
    number,
    number,
  ]
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  if (max - min < 0.15 || max !== g) return false
  const hue = 60 * ((b - r) / (max - min) + 2)
  return hue > 75 && hue < 165
}

describe('neon district scene', () => {
  it('is the same city every visit', () => {
    expect(buildTowers(2.8)).toEqual(buildTowers(2.8))
    expect(buildShops(2.8)).toEqual(buildShops(2.8))
    expect(buildWalkers(20)).toEqual(buildWalkers(20))
  })

  it('fills the whole width with towers and shopfronts', () => {
    for (const row of [buildTowers(2.8), buildShops(2.8)]) {
      expect(row[0]?.x).toBeLessThanOrEqual(0)
      const last = row.at(-1)
      expect((last?.x ?? 0) + (last?.w ?? 0)).toBeGreaterThanOrEqual(2.8)
      // No gaps between neighbours bigger than an alley.
      row.slice(1).forEach((item, i) => {
        const prev = row[i]
        expect(item.x - ((prev?.x ?? 0) + (prev?.w ?? 0))).toBeLessThan(0.04)
      })
    }
  })

  it('keeps towers inside the sky', () => {
    for (const t of buildTowers(2.8)) expect(t.h + t.spire).toBeLessThan(0.85)
  })

  it('shows more street, not bigger buildings, on wider screens', () => {
    expect(buildTowers(6).length).toBeGreaterThan(buildTowers(1.3).length * 3)
    expect(buildShops(6).length).toBeGreaterThan(buildShops(1.3).length * 3)
  })

  it('keeps signs on their own shop without overlapping', () => {
    for (const shop of buildShops(6)) {
      for (const sign of shop.signs) {
        expect(sign.x).toBeGreaterThan(shop.x)
        expect(sign.x).toBeLessThan(shop.x + shop.w)
        expect(sign.vertical && sign.text.length > 4).toBe(false)
      }
      const [a, b] = shop.signs
      expect(a && b ? Math.abs(a.x - b.x) : Infinity).toBeGreaterThan(shop.w * 0.25)
    }
  })

  it('never uses green: on this site green only means Active', () => {
    for (const color of NEON) expect(isGreenish(color)).toBe(false)
    for (const shop of buildShops(2.8))
      for (const s of shop.signs) expect(isGreenish(s.color)).toBe(false)
    for (const w of buildWalkers(40)) expect(isGreenish(w.rim)).toBe(false)
  })

  it('walks people at the same speed on any refresh rate', () => {
    const [w] = buildWalkers(1)
    if (!w) throw new Error('no walker')
    // One second in 60 steps or 144 steps lands in the same place: motion is time-based.
    expect(walkerX(w, 1000, 1200)).toBeCloseTo(walkerX(w, 1000, 1200))
    const step60 = walkerX(w, 1000 / 60, 1200) - walkerX(w, 0, 1200)
    const step144 = walkerX(w, 1000 / 144, 1200) - walkerX(w, 0, 1200)
    expect(step60 / step144).toBeCloseTo(144 / 60, 1)
  })

  it('wraps walkers around the street edges', () => {
    for (const w of buildWalkers(30)) {
      for (const t of [0, 5_000, 60_000, 600_000]) {
        const x = walkerX(w, t, 800)
        expect(x).toBeGreaterThanOrEqual(-60)
        expect(x).toBeLessThan(860)
      }
    }
  })

  it('swings legs within a natural range', () => {
    const [w] = buildWalkers(1)
    if (!w) throw new Error('no walker')
    for (let t = 0; t < 2000; t += 37) expect(Math.abs(stride(w, t))).toBeLessThanOrEqual(0.45)
  })

  it('runs the train across and then away', () => {
    expect(trainX(0, 1000, 300)).toBe(1300)
    expect(trainX(5200, 1000, 300)).toBeCloseTo(-300)
    expect(trainX(9000, 1000, 300)).toBeNull()
    expect(trainX(16_000, 1000, 300)).toBe(1300)
  })

  it('keeps steady signs lit and flickers the rest briefly', () => {
    const steady: Sign = { x: 0, y: 0, text: 'OPEN', vertical: false, color: NEON[0], flicker: 0 }
    const flicky: Sign = { ...steady, flicker: 4 }
    expect(signOn(steady, 50)).toBe(true)
    expect(signOn(flicky, 50)).toBe(false)
    expect(signOn(flicky, 1000)).toBe(true)
    let off = 0
    for (let t = 0; t < 4000; t += 10) if (!signOn(flicky, t)) off++
    expect(off / 400).toBeLessThan(0.1)
  })
})
