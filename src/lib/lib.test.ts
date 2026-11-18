import { describe, expect, it } from 'vitest'
import { sectionIndex, sections } from '@/content/sections'
import { getEmail } from '@/lib/email'
import { formatClock } from '@/lib/time'

describe('formatClock', () => {
  it('formats 24-hour time in the target zone', () => {
    // 10:05 UTC is 14:05 in Abu Dhabi (UTC+4, no DST)
    expect(formatClock(new Date('2026-11-17T10:05:00Z'), 'Asia/Dubai')).toBe('14:05')
  })

  it('pads midnight correctly', () => {
    expect(formatClock(new Date('2026-11-17T20:00:00Z'), 'Asia/Dubai')).toBe('00:00')
  })
})

describe('getEmail', () => {
  it('joins the parts into an address', () => {
    expect(getEmail({ user: 'a', domain: 'b.com' })).toBe('a@b.com')
  })
})

describe('sections', () => {
  it('have unique ids', () => {
    const ids = sections.map((s) => s.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('are indexed from 1', () => {
    expect(sectionIndex('profile')).toBe(1)
    expect(sectionIndex('contact')).toBe(sections.length)
  })
})
