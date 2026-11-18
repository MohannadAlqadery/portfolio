import { render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { heroQuery, heroResult } from '@/content/hero'
import { buildSchedule, charsAt, queryText, splitLines, type QueryLine } from './kql'
import { QueryConsole } from './QueryConsole'

const sample: QueryLine[] = [
  [{ kind: 'table', text: 'T' }],
  [
    { kind: 'pipe', text: '| ' },
    { kind: 'keyword', text: 'take' },
  ],
]

describe('queryText', () => {
  it('joins lines with newlines', () => {
    expect(queryText(sample)).toBe('T\n| take')
  })
})

describe('buildSchedule', () => {
  const text = queryText(heroQuery)

  it('has one strictly increasing timestamp per character', () => {
    const schedule = buildSchedule(text)
    expect(schedule).toHaveLength(text.length)
    for (let i = 1; i < schedule.length; i++) {
      expect(schedule[i]).toBeGreaterThan(schedule[i - 1] ?? -1)
    }
  })

  it('is deterministic for a given seed', () => {
    expect(buildSchedule(text, { seed: 3 })).toEqual(buildSchedule(text, { seed: 3 }))
  })

  it('types the whole query in a few seconds', () => {
    const total = buildSchedule(text).at(-1) ?? 0
    expect(total).toBeGreaterThan(3000)
    expect(total).toBeLessThan(9000)
  })
})

describe('charsAt', () => {
  it('counts characters visible at a time', () => {
    const schedule = [10, 20, 30]
    expect(charsAt(schedule, 0)).toBe(0)
    expect(charsAt(schedule, 20)).toBe(2)
    expect(charsAt(schedule, 999)).toBe(3)
  })
})

describe('splitLines', () => {
  it('puts the caret at the start of an empty first token', () => {
    const [first] = splitLines(sample, 0)
    expect(first?.caretIndex).toBe(0)
    expect(first?.tokens[0]).toEqual({ kind: 'table', typed: '', rest: 'T' })
  })

  it('puts the caret at the end of a finished line before the newline is typed', () => {
    const lines = splitLines(sample, 1)
    expect(lines[0]?.caretIndex).toBe(1)
    expect(lines[1]?.hasCaret).toBe(false)
  })

  it('moves to the next line once the newline is typed', () => {
    const lines = splitLines(sample, 2)
    expect(lines[0]?.hasCaret).toBe(false)
    expect(lines[1]?.caretIndex).toBe(0)
  })

  it('splits a token mid-way', () => {
    const lines = splitLines(sample, 6) // "T\n| ta"
    expect(lines[1]?.tokens[1]).toEqual({ kind: 'keyword', typed: 'ta', rest: 'ke' })
    expect(lines[1]?.caretIndex).toBe(1)
  })

  it('ends with the caret after the last token when complete', () => {
    const lines = splitLines(sample, queryText(sample).length)
    expect(lines[1]?.caretIndex).toBe(2)
  })
})

describe('QueryConsole', () => {
  beforeEach(() => {
    vi.stubGlobal('matchMedia', (query: string) => ({
      matches: query.includes('reduce'),
      media: query,
      addEventListener: () => {},
      removeEventListener: () => {},
    }))
  })
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('shows the finished result immediately when reduced motion is preferred', () => {
    render(<QueryConsole query={heroQuery} result={heroResult} />)

    expect(screen.getByRole('button', { name: /Run again/ })).toBeInTheDocument()
    expect(screen.getByText('Completed')).toBeInTheDocument()
  })

  it('exposes the query and result to assistive tech', () => {
    const { container } = render(<QueryConsole query={heroQuery} result={heroResult} />)
    const mirror = container.querySelector('.sr-only')
    if (!(mirror instanceof HTMLElement)) throw new Error('mirror not found')

    expect(within(mirror).getByText(/SecurityAnalysts/)).toBeInTheDocument()
    for (const row of heroResult) {
      expect(within(mirror).getByText(row.value)).toBeInTheDocument()
    }
  })
})
