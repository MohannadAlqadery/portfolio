/** Seeded randomness shared by generative pieces (hero monogram, footer crowd). */

/** Small deterministic PRNG (mulberry32), so a seed always draws the same card. */
export function createRandom(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export const pick = (pool: string, random: () => number): string =>
  pool[Math.floor(random() * pool.length)] ?? ' '
