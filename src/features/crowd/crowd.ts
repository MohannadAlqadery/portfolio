/**
 * Layout and "detections" for the footer crowd. Pure functions, seeded, so tests and server
 * renders get the same crowd every time.
 */
import { createRandom } from '@/lib/random'

export type Walker = {
  id: number
  /** Index into the peeps list. */
  peep: number
  /** 0 = back row (smaller, higher), 2 = front row. */
  row: 0 | 1 | 2
  /** Seconds to cross the band once. */
  duration: number
  /** Negative start offset (s), so the crowd is spread out from the first frame. */
  delay: number
  /** Walks right-to-left (figure mirrored). */
  reverse: boolean
  /** Seconds per step bounce. */
  step: number
  /** Resting position for reduced motion, 0–1 across the band. */
  rest: number
  /** Hidden on narrow screens (every fourth walker), so phones get a crowd but not a wall. */
  wideOnly: boolean
}

export function buildCrowd(count: number, peepCount: number, seed = 11): Walker[] {
  const random = createRandom(seed)
  return Array.from({ length: count }, (_, id) => {
    const row = (id % 3) as Walker['row']
    // Back rows drift slower: a little parallax.
    const duration = (row === 0 ? 70 : row === 1 ? 56 : 44) + random() * 18
    return {
      id,
      peep: id % peepCount,
      row,
      duration: Math.round(duration),
      delay: -Math.round(random() * duration),
      reverse: random() < 0.45,
      step: Number((0.55 + random() * 0.25).toFixed(2)),
      rest: (id + random() * 0.6) / count,
      wideOnly: id % 4 === 3,
    }
  })
}

export type DetectionKind = 'benign' | 'user' | 'anomaly'

export type Detection = {
  key: number
  walker: number
  kind: DetectionKind
  /** Shown in the tag, e.g. "benign 0.97". */
  label: string
  /** Anomalies are triaged a moment after they appear. */
  triaged: boolean
}

const BENIGN = ['benign', 'known host', 'baseline', 'allowlisted']

/** Next detection: mostly benign or verified users, roughly one in five an anomaly to triage. */
export function nextDetection(key: number, walkers: number[], random: () => number): Detection {
  const walker = walkers[Math.floor(random() * walkers.length)] ?? 0
  const roll = random()
  if (roll < 0.2) {
    return {
      key,
      walker,
      kind: 'anomaly',
      label: `anomaly ${(0.2 + random() * 0.25).toFixed(2)}`,
      triaged: false,
    }
  }
  if (roll < 0.5) {
    return { key, walker, kind: 'user', label: 'verified user', triaged: false }
  }
  const tag = BENIGN[Math.floor(random() * BENIGN.length)] ?? 'benign'
  return {
    key,
    walker,
    kind: 'benign',
    label: `${tag} ${(0.9 + random() * 0.09).toFixed(2)}`,
    triaged: false,
  }
}
