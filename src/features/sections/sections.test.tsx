import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { cases } from '@/content/cases'
import { credentials } from '@/content/credentials'
import { education } from '@/content/education'
import { profile } from '@/content/profile'
import { site } from '@/content/site'
import { toolkit } from '@/content/toolkit'
import { formatDuration, formatMonth, monthsBetween, toYearMonth } from '@/lib/dates'
import { CaseFilesSection } from './CaseFilesSection'
import { ContactSection } from './ContactSection'
import { ToolkitSection } from './ToolkitSection'

describe('dates', () => {
  it('formats months', () => {
    expect(formatMonth('2026-08')).toBe('Aug 2026')
  })

  it('counts months inclusively', () => {
    expect(monthsBetween('2025-07', '2025-08')).toBe(2)
    expect(monthsBetween('2024-08', '2026-06')).toBe(23)
  })

  it('formats durations', () => {
    expect(formatDuration(2)).toBe('2 mo')
    expect(formatDuration(12)).toBe('1 yr')
    expect(formatDuration(23)).toBe('1 yr 11 mo')
  })

  it('converts a date to YYYY-MM', () => {
    expect(toYearMonth(new Date(2026, 10, 17))).toBe('2026-11')
  })

  it('rejects malformed input', () => {
    expect(() => formatMonth('2026-13')).toThrow('Invalid YYYY-MM date')
  })
})

describe('content integrity', () => {
  const everything = JSON.stringify({ site, profile, cases, credentials, toolkit, education })

  it('never contains a phone number', () => {
    expect(everything).not.toMatch(/\+?971|\b05\d[\s-]?\d{3}[\s-]?\d{4}\b|8433/)
  })

  it('never contains the email address in plain form', () => {
    expect(everything).not.toContain(`${site.emailParts.user}@${site.emailParts.domain}`)
  })

  it('has well-formed, ordered case dates', () => {
    const closed = cases.filter((c) => c.end !== null)
    for (const file of closed) {
      expect(monthsBetween(file.start, file.end ?? file.start)).toBeGreaterThan(0)
    }
    for (const file of cases) {
      expect(file.status === 'active').toBe(file.end === null)
    }
  })

  it('has unique case ids and toolkit items', () => {
    expect(new Set(cases.map((c) => c.id)).size).toBe(cases.length)
    const items = toolkit.flatMap((c) => c.items.map((i) => i.name))
    expect(new Set(items).size).toBe(items.length)
  })

  it('self-hosts badges and keeps credential dates ordered', () => {
    const withBadge = credentials.filter((c) => c.badge)
    expect(withBadge.every((c) => c.badge?.src.startsWith('/badges/'))).toBe(true)
    const dated = credentials.filter((c) => c.issued && c.expires)
    expect(dated.every((c) => (c.issued ?? '') < (c.expires ?? ''))).toBe(true)
  })

  it('only links credentials to https URLs', () => {
    const urls = credentials.flatMap((c) => (c.verifyUrl ? [c.verifyUrl] : []))
    expect(urls.every((url) => url.startsWith('https://'))).toBe(true)
  })
})

describe('CaseFilesSection', () => {
  const folder = (name: RegExp) => screen.getByRole('button', { name })

  it('opens the active case by default, as a folder and a case sheet', () => {
    render(<CaseFilesSection />)
    expect(folder(/SOC L1 Analyst/)).toHaveAttribute('aria-expanded', 'true')
    expect(folder(/Cybersecurity Intern/)).toHaveAttribute('aria-expanded', 'false')
    expect(screen.getByRole('heading', { level: 3, name: 'SOC L1 Analyst' })).toBeInTheDocument()
  })

  it('switches the sheet to another folder, and closes it when the open folder is clicked', async () => {
    const user = userEvent.setup()
    render(<CaseFilesSection />)

    await user.click(folder(/Cybersecurity Intern/))
    expect(folder(/Cybersecurity Intern/)).toHaveAttribute('aria-expanded', 'true')
    expect(folder(/SOC L1 Analyst/)).toHaveAttribute('aria-expanded', 'false')
    expect(
      await screen.findByRole('heading', { level: 3, name: 'Cybersecurity Intern' }),
    ).toBeInTheDocument()

    await user.click(folder(/Cybersecurity Intern/))
    expect(await screen.findByText(/No case open/)).toBeInTheDocument()
  })

  it('gives every case a folder (long titles use their short label) and links the notes', () => {
    render(<CaseFilesSection />)
    for (const file of cases)
      expect(folder(new RegExp(file.shortTitle ?? file.title))).toBeVisible()
    expect(screen.getByRole('link', { name: /Field notes/ })).toHaveAttribute('href', '/notes')
  })
})

describe('ToolkitSection', () => {
  it('renders one labelled column per tactic with all its techniques', () => {
    render(<ToolkitSection />)
    for (const column of toolkit) {
      const region = screen.getByRole('region', { name: column.title })
      expect(within(region).getAllByRole('listitem')).toHaveLength(column.items.length)
    }
  })
})

describe('ContactSection', () => {
  it('keeps the address hidden until revealed, then copies it', async () => {
    const user = userEvent.setup()
    const writeText = vi.fn<(text: string) => Promise<void>>().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true })
    const address = `${site.emailParts.user}@${site.emailParts.domain}`

    const { container } = render(<ContactSection />)
    expect(container.textContent).not.toContain(address)

    await user.click(screen.getByRole('button', { name: /Reveal address/ }))
    expect(screen.getByText(address)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Write/ })).toHaveAttribute('href', `mailto:${address}`)

    await user.click(screen.getByRole('button', { name: /Copy/ }))
    expect(writeText).toHaveBeenCalledWith(address)
    expect(await screen.findByRole('button', { name: /Copied/ })).toBeInTheDocument()
  })
})
