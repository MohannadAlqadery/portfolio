/**
 * Tiny model for the hero's KQL "console": pre-tokenised lines, a deterministic typing schedule and
 * a splitter that tells the renderer how much of each token is typed so far.
 */

export type TokenKind = 'table' | 'pipe' | 'keyword' | 'operator' | 'field' | 'string' | 'plain'

export type Token = { kind: TokenKind; text: string }
export type QueryLine = Token[]

/** Plain text of the query, lines joined with `\n` (each newline counts as one typed character). */
export function queryText(lines: readonly QueryLine[]): string {
  return lines.map((line) => line.map((t) => t.text).join('')).join('\n')
}

/** Seeded PRNG (mulberry32) so the typing rhythm is identical on every visit and in tests. */
function mulberry32(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export type ScheduleOptions = {
  /** Base delay per character, ms. */
  base?: number
  /** Max random extra per character, ms. */
  jitter?: number
  /** Extra pause after a line break, ms. */
  lineBreak?: number
  seed?: number
}

/**
 * Cumulative timestamps (ms from start) at which each character appears.
 * `schedule[i]` is when character `i` becomes visible; the array length is the character count.
 */
export function buildSchedule(text: string, options: ScheduleOptions = {}): number[] {
  const { base = 34, jitter = 28, lineBreak = 260, seed = 7 } = options
  const random = mulberry32(seed)
  const schedule: number[] = []
  let t = 0

  for (let i = 0; i < text.length; i++) {
    const previous = text[i - 1]
    t += base + random() * jitter
    if (previous === '\n') t += lineBreak
    if (previous === '|') t += 40
    schedule.push(Math.round(t))
  }
  return schedule
}

/** Number of characters whose timestamp is `<= elapsed` (binary search). */
export function charsAt(schedule: readonly number[], elapsed: number): number {
  let lo = 0
  let hi = schedule.length
  while (lo < hi) {
    const mid = (lo + hi) >>> 1
    if ((schedule[mid] ?? Infinity) <= elapsed) lo = mid + 1
    else hi = mid
  }
  return lo
}

export type SplitToken = { kind: TokenKind; typed: string; rest: string }
export type SplitLine = { tokens: SplitToken[]; hasCaret: boolean; caretIndex: number }

/**
 * Split every token into its typed and untyped part for `count` typed characters.
 * The caret sits on the line currently being typed, after `caretIndex` tokens' typed text.
 */
export function splitLines(lines: readonly QueryLine[], count: number): SplitLine[] {
  let cursor = 0
  let caretPlaced = false

  return lines.map((line, lineIndex) => {
    if (lineIndex > 0) cursor += 1 // the newline before this line

    let caretIndex = -1
    const tokens = line.map((token, tokenIndex) => {
      const typedLength = Math.max(0, Math.min(token.text.length, count - cursor))
      cursor += token.text.length
      if (!caretPlaced && typedLength < token.text.length) {
        caretPlaced = true
        caretIndex = tokenIndex
      }
      return {
        kind: token.kind,
        typed: token.text.slice(0, typedLength),
        rest: token.text.slice(typedLength),
      }
    })

    // Fully typed line followed by an untyped newline: caret at end of this line.
    const lineEnd = cursor
    if (!caretPlaced && count <= lineEnd) {
      caretPlaced = true
      caretIndex = tokens.length
    }

    return { tokens, hasCaret: caretIndex !== -1, caretIndex }
  })
}
