/** Glyph pool for the "decrypt" text effect: caps, digits and a few symbols. */
export const DECRYPT_GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#$%&@<>/[]{}*+=?'

export const randomGlyph = (glyphs: string = DECRYPT_GLYPHS): string =>
  glyphs[Math.floor(Math.random() * glyphs.length)] ?? ''

/** Every non-space character replaced by a random glyph (keeps length and word gaps). */
export function scramble(text: string, glyphs: string = DECRYPT_GLYPHS): string {
  return text.replace(/\S/g, () => randomGlyph(glyphs))
}
