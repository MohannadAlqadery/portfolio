import { describe, expect, it } from 'vitest'
import { credentials } from '@/content/credentials'
import { site } from '@/content/site'
import { respond, SUGGESTIONS } from './engine'

const text = (input: string) =>
  respond(input)
    .lines.map((l) => l.text)
    .join('\n')

describe('terminal engine', () => {
  it('lists the commands on help', () => {
    expect(text('help')).toMatch(/whoami[\s\S]*certs[\s\S]*goto/)
  })

  it('answers every suggestion chip with something real', () => {
    for (const question of SUGGESTIONS) {
      const reply = respond(question)
      expect(reply.lines.length).toBeGreaterThan(0)
      expect(reply.lines[0]?.tone).not.toBe('warn')
    }
  })

  it('maps plain questions and commands to the same answers', () => {
    expect(text('Which certifications do you hold?')).toBe(text('certs'))
    expect(text('how can I reach you')).toBe(text('contact'))
    expect(text('What do you do?')).toBe(text('whoami'))
  })

  it('lists every certification with where to verify it', () => {
    const out = text('certs')
    for (const c of credentials) expect(out).toContain(c.code)
    expect(out).toContain('verify at learn.microsoft.com')
  })

  it('filters the toolkit', () => {
    expect(text('tools kql')).toMatch(/^KQL · Query and Scripting · used on shift$/m)
    expect(text('tools cobol')).toMatch(/Nothing in my toolkit matches "cobol"/)
  })

  it('never puts the email address in its text; it asks the page to reveal it', () => {
    const address = `${site.emailParts.user}@${site.emailParts.domain}`
    for (const input of ['contact', 'email', 'how do I email you?']) {
      expect(text(input)).not.toContain(address)
    }
    expect(respond('email').action).toEqual({ type: 'reveal-email' })
  })

  it('turns navigation commands into actions', () => {
    expect(respond('goto toolkit').action).toEqual({ type: 'goto', id: 'toolkit' })
    expect(respond('cd experience').action).toEqual({ type: 'goto', id: 'timeline' })
    expect(respond('open notes').action).toEqual({ type: 'navigate', path: '/notes' })
    expect(respond('goto nowhere').lines[0]?.tone).toBe('warn')
    expect(respond('exit').action).toEqual({ type: 'close' })
  })

  it('says plainly that it is scripted when it does not understand, and offers the chips again', () => {
    const reply = respond('fhqwhgads')
    expect(reply.lines[0]).toEqual({
      text: 'I don’t have an answer for "fhqwhgads" yet.',
      tone: 'warn',
    })
    expect(reply.lines[1]?.text).toMatch(/not an AI/)
    expect(reply.fallback).toBe(true)
    expect(respond('certs').fallback).toBeUndefined()
  })

  it('speaks in the first person, in full sentences', () => {
    expect(text('whoami')).toMatch(/^I’m Mohannad Alqadery, a SOC analyst./)
    expect(text('certs')).toMatch(/^Here’s what I’m certified in:/)
    expect(text('contact')).toMatch(/^The best ways to reach me:/)
    expect(text('are you an AI?')).toMatch(/scripted terminal, not an AI/)
    expect(text('thanks')).toMatch(/^Anytime/)
  })

  it('lists every course under study', () => {
    expect(text('study')).toMatch(/Risk Assessment/)
    expect(text('study')).toContain('Cloud Security (AWS)')
  })
})
