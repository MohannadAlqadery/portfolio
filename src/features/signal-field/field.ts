/**
 * Pure helpers for the footer's signal field: grid sizing, packets of "traffic" and the scan
 * sweep. Everything is time-based (milliseconds, pixels per second), so the animation runs at
 * the same speed on 60, 120 or 144 Hz displays.
 */

/** Cell size (CSS px) for a field this wide: denser on small screens, capped on huge ones. */
export function cellSizeFor(width: number): number {
  return Math.max(4, Math.min(9, Math.round(width / 200)))
}

export type Packet = {
  /** Grid row it travels along. */
  row: number
  /** Leading edge, in CSS px. */
  x: number
  /** CSS px per second. */
  speed: number
  /** Tail length in cells. */
  tail: number
}

export function spawnPacket(
  rows: number,
  width: number,
  random: () => number,
  onScreen = false,
): Packet {
  return {
    row: Math.floor(random() * rows),
    // New packets enter from the left edge; the first batch starts spread across the field.
    x: onScreen ? random() * width : -random() * width * 0.5,
    speed: 140 + random() * 260,
    tail: 4 + Math.floor(random() * 8),
  }
}

/** Advance packets by `dt` ms; ones that leave on the right re-enter on the left. */
export function stepPackets(
  packets: Packet[],
  dt: number,
  rows: number,
  width: number,
  random: () => number,
): Packet[] {
  return packets.map((p) => {
    const x = p.x + (p.speed * dt) / 1000
    return x > width + p.tail * 10 ? spawnPacket(rows, width, random) : { ...p, x }
  })
}

/**
 * Horizontal position of the scan line at time `t` (ms): it crosses the field in `cross` ms,
 * then rests off screen for the rest of the `period`.
 */
export function sweepX(t: number, width: number, period = 7000, cross = 2600): number {
  const phase = t % period
  if (phase > cross) return -1e6
  return -80 + (phase / cross) * (width + 160)
}

/** Smooth 1 → 0 falloff over `radius`. */
export function falloff(distance: number, radius: number): number {
  if (distance >= radius) return 0
  const k = 1 - distance / radius
  return k * k * (3 - 2 * k)
}

/** Exponential decay of a lit cell: 1 when just lit, about 0 after a few `ms`. */
export function decay(sinceMs: number, ms = 650): number {
  return sinceMs < 0 ? 0 : Math.exp(-sinceMs / ms)
}
