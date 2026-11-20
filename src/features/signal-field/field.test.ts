import { describe, expect, it } from 'vitest'
import { createRandom } from '@/lib/random'
import { cellSizeFor, decay, falloff, spawnPacket, stepPackets, sweepX } from './field'

describe('signal field', () => {
  it('keeps cells between 4 and 9 px from phones to ultrawides', () => {
    expect(cellSizeFor(280)).toBe(4)
    expect(cellSizeFor(1200)).toBe(6)
    expect(cellSizeFor(3440)).toBe(9)
  })

  it('moves packets by time, not frames: one 32 ms step equals two 16 ms steps', () => {
    const start = [{ row: 3, x: 100, speed: 250, tail: 6 }]
    const random = createRandom(1)
    const once = stepPackets(start, 32, 20, 2000, random)
    const twice = stepPackets(stepPackets(start, 16, 20, 2000, random), 16, 20, 2000, random)
    expect(once[0]?.x).toBeCloseTo(108)
    expect(twice[0]?.x).toBeCloseTo(108)
  })

  it('sends packets that leave on the right back in from the left', () => {
    const random = createRandom(2)
    const [p] = stepPackets([{ row: 1, x: 1190, speed: 400, tail: 4 }], 1000, 20, 1200, random)
    expect(p?.x).toBeLessThanOrEqual(0)
    expect(p?.row).toBeGreaterThanOrEqual(0)
    expect(p?.row).toBeLessThan(20)
  })

  it('spawns packets on the grid at a sane speed', () => {
    const p = spawnPacket(30, 1000, createRandom(3), true)
    expect(p.row).toBeLessThan(30)
    expect(p.x).toBeGreaterThanOrEqual(0)
    expect(p.speed).toBeGreaterThanOrEqual(140)
    expect(p.speed).toBeLessThanOrEqual(400)
  })

  it('sweeps across, then rests off screen', () => {
    expect(sweepX(0, 1000)).toBeLessThan(0)
    expect(sweepX(1300, 1000)).toBeGreaterThan(400)
    expect(sweepX(1300, 1000)).toBeLessThan(700)
    expect(sweepX(5000, 1000)).toBeLessThan(-1000)
  })

  it('falls off smoothly and decays over time', () => {
    expect(falloff(0, 90)).toBe(1)
    expect(falloff(45, 90)).toBeCloseTo(0.5)
    expect(falloff(90, 90)).toBe(0)
    expect(decay(0)).toBe(1)
    expect(decay(2000)).toBeLessThan(0.05)
    expect(decay(-5)).toBe(0)
  })
})
