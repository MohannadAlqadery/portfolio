import { describe, expect, it } from 'vitest'
import { matchRoute, normalisePath } from '@/lib/router'
import { findNote, neighbours, notes } from './notes'
import { slugify } from './slugify'

describe('router', () => {
  it('normalises trailing slashes', () => {
    expect(normalisePath('/notes/')).toBe('/notes')
    expect(normalisePath('/')).toBe('/')
  })

  it('resolves pre-rendered file names to their routes', () => {
    expect(matchRoute('/index.html')).toEqual({ name: 'home' })
    expect(matchRoute('/notes.html')).toEqual({ name: 'notes' })
    expect(matchRoute('/notes/ejptv2.html')).toEqual({ name: 'note', slug: 'ejptv2' })
    expect(matchRoute('/404.html')).toEqual({ name: 'not-found' })
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
  it('follows the Credentials order, so eJPTv2 is followed by eSOC', () => {
    expect(notes.map((n) => n.cert)).toEqual(['SC-200', 'eJPTv2', 'eSOC'])
    expect(neighbours('sc-200')).toMatchObject({ previous: undefined, next: { slug: 'ejptv2' } })
    expect(neighbours('ejptv2')).toMatchObject({
      previous: { slug: 'sc-200' },
      next: { slug: 'esoc' },
    })
    expect(neighbours('esoc')).toMatchObject({ previous: { slug: 'ejptv2' }, next: undefined })
  })

  it('has exactly one page per earned certification', () => {
    expect(notes.map((n) => n.cert).sort()).toEqual(['SC-200', 'eJPTv2', 'eSOC'].sort())
  })

  it('builds an "On this page" table of contents for every note', () => {
    for (const note of notes) {
      expect(note.toc.length).toBeGreaterThan(4)
      expect(new Set(note.toc.map((item) => item.id)).size).toBe(note.toc.length)
      expect(note.toc.every((item) => /^[a-z0-9-]+$/.test(item.id))).toBe(true)
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

  it('has unique slugs and orders', () => {
    expect(new Set(notes.map((n) => n.slug)).size).toBe(notes.length)
    expect(new Set(notes.map((n) => n.order)).size).toBe(notes.length)
  })

  it('finds notes and their neighbours', () => {
    const first = notes[0]
    if (!first) throw new Error('no notes')
    expect(findNote(first.slug)?.title).toBe(first.title)
    expect(findNote('missing')).toBeUndefined()
    expect(neighbours(first.slug).previous).toBeUndefined()
  })

  it('never publishes contact details', () => {
    // Notes are public: guard against pasting an email or phone number into one.
    const text = notes.map((n) => `${n.title} ${n.description}`).join(' ')
    expect(text).not.toMatch(/@gmail|\+971|\b05\d{8}\b/)
  })
})
