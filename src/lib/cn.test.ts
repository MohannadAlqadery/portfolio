import { describe, expect, it } from 'vitest'
import { cn } from '@/lib/cn'

describe('cn', () => {
  it('joins conditional classes', () => {
    expect(cn('a', undefined, { b: false, c: true })).toBe('a c')
  })

  it('keeps a custom font size alongside a custom text colour', () => {
    expect(cn('text-fg', 'text-display')).toBe('text-fg text-display')
  })

  it('lets the last custom colour win', () => {
    expect(cn('text-fg', 'text-signal')).toBe('text-signal')
  })
})
