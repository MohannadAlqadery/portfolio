import { describe, expect, it } from 'vitest'
import { matchRoute, normalisePath } from '@/lib/router'
import { findNote, neighbours, notes } from './notes'
import { slugify } from './slugify'

describe('router', () => {
  it('normalises trailing slashes', () => {
    expect(normalisePath('/notes/')).toBe('/notes')
    expect(normalisePath('/')).toBe('/')
  })

  it('matches every route', () => {
    expect(matchRoute('/')).toEqual({ name: 'home' })
    expect(matchRoute('/notes/')).toEqual({ name: 'notes' })
    expect(matchRoute('/notes/sc-200-field-notes')).toEqual({
      name: 'note',
      slug: 'sc-200-field-notes',
    })
    expect(matchRoute('/notes/../etc/passwd')).toEqual({ name: 'not-found' })
    expect(matchRoute('/anything')).toEqual({ name: 'not-found' })
  })
})

describe('slugify', () => {
  it('makes url-safe ids', () => {
    expect(slugify('SC-200: KQL & Sentinel')).toBe('sc-200-kql-sentinel')
    expect(slugify('  Triage in six questions  ')).toBe('triage-in-six-questions')
  })
})

describe('notes', () => {
  it('has at least two notes for each certification', () => {
    for (const cert of ['SC-200', 'eJPTv2', 'eSOC']) {
      expect(notes.filter((n) => n.cert === cert).length).toBeGreaterThanOrEqual(2)
    }
  })

  it('uses the eJPTv2 name, never the bare "eJPT"', () => {
    const text = notes.map((n) => `${n.title} ${n.description} ${n.tags.join(' ')}`).join(' ')
    expect(text).not.toMatch(/eJPT(?!v2)/)
  })

  it('has complete, well-formed frontmatter', () => {
    for (const note of notes) {
      expect(note.title.length).toBeGreaterThan(10)
      expect(note.description.length).toBeGreaterThan(40)
      expect(note.description.length).toBeLessThanOrEqual(200)
      expect(note.date).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      expect(note.tags.length).toBeGreaterThan(0)
      expect(note.readingMinutes).toBeGreaterThan(0)
      expect(note.slug).toMatch(/^[a-z0-9-]+$/)
    }
  })

  it('has unique slugs and is sorted newest first', () => {
    expect(new Set(notes.map((n) => n.slug)).size).toBe(notes.length)
    const dates = notes.map((n) => n.date)
    expect([...dates].sort().reverse()).toEqual(dates)
  })

  it('finds notes and their neighbours', () => {
    const first = notes[0]
    if (!first) throw new Error('no notes')
    expect(findNote(first.slug)?.title).toBe(first.title)
    expect(findNote('missing')).toBeUndefined()
    expect(neighbours(first.slug).newer).toBeUndefined()
  })

  it('never publishes contact details', () => {
    // Notes are public: guard against pasting an email or phone number into one.
    const text = notes.map((n) => `${n.title} ${n.description}`).join(' ')
    expect(text).not.toMatch(/@gmail|\+971|\b05\d{8}\b/)
  })
})
