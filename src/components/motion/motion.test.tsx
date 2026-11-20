import { act, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { DECRYPT_GLYPHS, scramble } from '@/lib/decrypt'
import { BlurText } from './BlurText'
import { DecryptText } from './DecryptText'
import { MotionProvider } from './MotionProvider'

function mockReducedMotion(reduce: boolean) {
  vi.stubGlobal(
    'matchMedia',
    vi.fn((query: string) => ({
      matches: reduce && query.includes('reduce'),
      media: query,
      addEventListener: () => {},
      removeEventListener: () => {},
    })),
  )
}

const visible = (container: HTMLElement) =>
  container.querySelector('[data-decrypt]')?.textContent ?? ''

afterEach(() => {
  vi.unstubAllGlobals()
  vi.useRealTimers()
})

describe('scramble', () => {
  it('keeps length and spaces, and only uses glyphs from the pool', () => {
    const out = scramble('SOC ANALYST')
    expect(out).toHaveLength(11)
    expect(out[3]).toBe(' ')
    for (const char of out.replace(' ', '')) expect(DECRYPT_GLYPHS).toContain(char)
  })
})

describe('DecryptText', () => {
  it('always exposes the real text to assistive tech', () => {
    mockReducedMotion(false)
    render(<DecryptText text="Security Analyst" />)
    expect(screen.getByText('Security Analyst', { selector: '.sr-only' })).toBeInTheDocument()
  })

  it('shows the final text immediately with reduced motion', () => {
    mockReducedMotion(true)
    const { container } = render(<DecryptText text="Security Analyst" />)
    expect(visible(container)).toBe('Security Analyst')
  })

  it('scrambles first, then settles on the real text', () => {
    mockReducedMotion(false)
    vi.useFakeTimers({ toFake: ['requestAnimationFrame', 'cancelAnimationFrame', 'performance'] })
    const { container } = render(<DecryptText text="TRIAGE" duration={600} />)
    expect(visible(container)).toHaveLength(6)
    expect(visible(container)).not.toBe('TRIAGE')

    act(() => {
      vi.advanceTimersByTime(1500)
    })
    expect(visible(container)).toBe('TRIAGE')
  })
})

describe('BlurText', () => {
  it('renders every word, with the full sentence available to assistive tech', () => {
    mockReducedMotion(false)
    render(
      <MotionProvider>
        <BlurText text="Signal over noise" trigger="mount" />
      </MotionProvider>,
    )
    expect(screen.getByText('Signal over noise', { selector: '.sr-only' })).toBeInTheDocument()
    expect(screen.getByText('noise')).toHaveAttribute(
      'class',
      expect.stringContaining('inline-block'),
    )
  })
})
