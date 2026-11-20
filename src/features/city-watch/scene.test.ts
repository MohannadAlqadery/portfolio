import { describe, expect, it } from 'vitest'
import {
  ADVISORIES,
  alpha,
  buildCity,
  buildWalkers,
  cablePoint,
  cadence,
  GROUND,
  mix,
  packetAt,
  PANEL_WORDS,
  paletteFor,
  PROFILES,
  ROW_HEIGHT,
  topOf,
  walkerX,
  walkSpeed,
  type Tokens,
} from './scene'

const DARK: Tokens = {
  canvas: '#0a0a0a',
  fg: '#f2f2f2',
  muted: '#a8a8a8',
  subtle: '#858585',
  line: '#232323',
  critical: '#e5534b',
  high: '#f0883e',
  medium: '#e8b14a',
}
const LIGHT: Tokens = {
  ...DARK,
  canvas: '#f4f4f2',
  fg: '#0a0a0a',
  muted: '#474747',
  subtle: '#646464',
}

/** Saturation of a hex colour, 0–1. */
function saturation(hex: string) {
  const n = parseInt(hex.slice(1), 16)
  const c = [(n >> 16) & 255, (n >> 8) & 255, n & 255]
  return (Math.max(...c) - Math.min(...c)) / 255
}

describe('city watch: colour', () => {
  it('mixes and fades colours', () => {
    expect(mix('#000000', '#ffffff', 0.5)).toBe('#808080')
    expect(mix('#0a0a0a', '#f2f2f2', 0)).toBe('#0a0a0a')
    expect(alpha('#ff0000', 0.5)).toBe('rgba(255,0,0,0.5)')
  })

  it('is built from the page tokens: the sky is the page background', () => {
    expect(paletteFor('dark', DARK).sky).toBe(DARK.canvas)
    expect(paletteFor('light', LIGHT).sky).toBe(LIGHT.canvas)
  })

  it('keeps the city itself monochrome; colour is only for severity', () => {
    for (const [theme, tokens] of [
      ['dark', DARK],
      ['light', LIGHT],
    ] as const) {
      const p = paletteFor(theme, tokens)
      const neutral = [
        p.sky,
        p.haze,
        ...p.layers,
        p.edge,
        p.window,
        p.shop,
        p.tube,
        p.street,
        p.person,
        p.rim,
      ]
      for (const c of neutral) expect(saturation(c)).toBeLessThan(0.05)
      expect([p.critical, p.high, p.medium]).toEqual([tokens.critical, tokens.high, tokens.medium])
    }
  })

  it('is night in the dark theme and day in the light one', () => {
    expect(paletteFor('dark', DARK).night).toBe(true)
    expect(paletteFor('light', LIGHT).night).toBe(false)
  })
})

describe('city watch: layout', () => {
  it('is the same city every visit', () => {
    expect(buildCity(2.8)).toEqual(buildCity(2.8))
    expect(buildWalkers(30)).toEqual(buildWalkers(30))
  })

  it('fills the whole street at every depth', () => {
    const { towers } = buildCity(2.8)
    for (const layer of [0, 1, 2] as const) {
      const row = towers.filter((t) => t.layer === layer)
      expect(row[0]?.x).toBeLessThanOrEqual(0)
      const last = row.at(-1)
      expect((last?.x ?? 0) + (last?.w ?? 0)).toBeGreaterThanOrEqual(2.8)
    }
  })

  it('keeps every rooftop inside the band, below the HUD line', () => {
    for (const t of buildCity(4).towers) expect(topOf(t)).toBeGreaterThan(0.05)
  })

  it('shows more street, not bigger buildings, on wider screens', () => {
    const narrow = buildCity(1.3).towers
    const wide = buildCity(6).towers
    expect(wide.length).toBeGreaterThan(narrow.length * 3)
    const maxW = (ts: typeof wide) => Math.max(...ts.map((t) => t.w))
    expect(maxW(wide)).toBeLessThanOrEqual(0.42)
  })

  it('gives each near building a shop sign and keeps screens on their building', () => {
    const city = buildCity(3)
    const near = city.towers.filter((t) => t.layer === 2)
    expect(city.signs).toHaveLength(near.length)
    for (const panel of city.panels) {
      const t = city.towers[panel.tower]
      expect(panel.x).toBeGreaterThanOrEqual(t?.x ?? Infinity)
      expect(panel.x + panel.w).toBeLessThanOrEqual((t?.x ?? 0) + (t?.w ?? 0))
      expect(panel.y + panel.h).toBeLessThan(GROUND)
    }
    expect(city.ticker).not.toBeNull()
  })

  it('names watched buildings as hosts', () => {
    const hosts = buildCity(3)
      .towers.filter((t) => t.layer > 0)
      .map((t) => t.host)
    expect(new Set(hosts).size).toBe(hosts.length)
    for (const h of hosts) expect(h).toMatch(/^HOST-\d{4,}$/)
  })
})

describe('city watch: people', () => {
  it('walks at a human pace on any refresh rate', () => {
    const walkers = buildWalkers(40).filter((w) => w.pace > 0)
    for (const w of walkers) {
      // Roughly 0.6–1 body heights a second, and steps that keep up with it.
      expect(walkSpeed(w) / (w.height * ROW_HEIGHT[w.row])).toBeGreaterThan(0.55)
      expect(cadence(w)).toBeGreaterThan(1.8)
      expect(cadence(w)).toBeLessThan(2.3)
    }
    const [w] = walkers
    if (!w) throw new Error('no walker')
    const step60 = walkerX(w, 1000 / 60, 1400, 500) - walkerX(w, 0, 1400, 500)
    const step144 = walkerX(w, 1000 / 144, 1400, 500) - walkerX(w, 0, 1400, 500)
    expect(step60 / step144).toBeCloseTo(144 / 60, 1)
  })

  it('has some people standing still, and some walking in pairs', () => {
    const walkers = buildWalkers(60)
    expect(walkers.some((w) => w.pace === 0)).toBe(true)
    expect(
      walkers.some(
        (w, i) =>
          i > 0 && walkers[i - 1]?.dir === w.dir && walkers[i - 1]?.pace === w.pace && w.pace > 0,
      ),
    ).toBe(true)
  })

  it('wraps walkers around the street edges', () => {
    for (const w of buildWalkers(30)) {
      for (const t of [0, 7_000, 90_000]) {
        const x = walkerX(w, t, 900, 400)
        expect(x).toBeGreaterThanOrEqual(-80)
        expect(x).toBeLessThan(980)
      }
    }
  })
})

describe('city watch: security events', () => {
  it('runs packets along their cables and loops', () => {
    expect(packetAt(0, 0, 4)).toBe(0)
    expect(packetAt(0, 2, 4)).toBe(0.5)
    expect(packetAt(4200, 0, 4)).toBe(0)
    const cable = { x1: 0, y1: 0.3, x2: 1, y2: 0.3, sag: 0.05, firewall: 0.5 }
    expect(cablePoint(cable, 0.5).y).toBeCloseTo(0.35)
    expect(cablePoint(cable, 0).y).toBeCloseTo(0.3)
  })

  it('resolves every flagged profile, and never flags without a severity', () => {
    for (const profile of PROFILES) {
      expect(Boolean(profile.sev)).toBe(Boolean(profile.then))
    }
  })

  it('keeps screen words short enough for a narrow vertical screen', () => {
    for (const word of PANEL_WORDS) expect(word.length).toBeLessThanOrEqual(6)
  })

  it('talks about patches, CVEs and anomalies', () => {
    const text = [
      ...ADVISORIES.map((a) => a.text),
      ...PROFILES.flatMap((p) => [...p.first, ...(p.then ?? [])]),
    ].join(' ')
    for (const word of ['CVE', 'PATCH', 'ANOMALY', 'UPDATE', 'BLOCKED'])
      expect(text).toContain(word)
  })
})
