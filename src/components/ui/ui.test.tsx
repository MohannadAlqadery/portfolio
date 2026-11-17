import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Button, ButtonLink } from './Button'
import { Chip } from './Chip'
import { Panel } from './Panel'
import { Rule } from './Rule'
import { SectionHeader } from './SectionHeader'
import { StatusDot } from './StatusDot'

describe('SectionHeader', () => {
  it('renders an h2 with a zero-padded, screen-reader friendly index', () => {
    render(<SectionHeader index={3} total={7} kicker="Case files" title="Work" headingId="work" />)

    const heading = screen.getByRole('heading', { level: 2, name: 'Work' })
    expect(heading).toHaveAttribute('id', 'work')
    expect(screen.getByText('03')).toBeInTheDocument()
    expect(screen.getByText('of 7', { exact: false })).toHaveClass('sr-only')
  })
})

describe('Chip', () => {
  it('applies severity styling', () => {
    render(<Chip variant="critical">sev:critical</Chip>)
    expect(screen.getByText('sev:critical')).toHaveClass('text-sev-critical')
  })
})

describe('StatusDot', () => {
  it('exposes its label only to assistive tech', () => {
    render(<StatusDot label="Online" />)
    expect(screen.getByText('Online')).toHaveClass('sr-only')
  })
})

describe('Rule', () => {
  it('is a labelled separator when annotated', () => {
    render(<Rule label="Evidence" />)
    expect(screen.getByRole('separator', { name: 'Evidence' })).toBeInTheDocument()
  })
})

describe('Panel', () => {
  it('renders header bar content', () => {
    render(
      <Panel title="CASE-2608" meta="active">
        body
      </Panel>,
    )
    expect(screen.getByText('CASE-2608')).toBeInTheDocument()
    expect(screen.getByText('active')).toBeInTheDocument()
  })
})

describe('Button', () => {
  it('defaults to type="button" so it never submits forms by accident', () => {
    render(<Button>Run</Button>)
    expect(screen.getByRole('button', { name: 'Run' })).toHaveAttribute('type', 'button')
  })

  it('adds safe rel attributes to external links', () => {
    render(
      <ButtonLink href="https://example.com" external>
        Out
      </ButtonLink>,
    )
    const link = screen.getByRole('link', { name: 'Out' })
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'noopener noreferrer')
  })
})
