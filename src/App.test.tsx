import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import App from '@/App.tsx'
import { sections } from '@/content/sections'

describe('App shell', () => {
  it('renders the page landmarks and the owner name as the main heading', () => {
    render(<App />)

    expect(screen.getByRole('banner')).toBeInTheDocument()
    expect(screen.getByRole('main')).toBeInTheDocument()
    expect(screen.getByRole('contentinfo')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Mohannad Alqadery')
  })

  it('lists every section in the menu and renders each section landmark', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: 'Open menu' }))
    const nav = screen.getByRole('navigation', { name: 'Sections' })
    for (const section of sections) {
      expect(within(nav).getByRole('link', { name: new RegExp(section.label) })).toHaveAttribute(
        'href',
        `/#${section.id}`,
      )
      expect(document.getElementById(section.id)).toBeInTheDocument()
    }
  })

  it('offers a skip link as the first focusable element', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.tab()
    expect(screen.getByRole('link', { name: 'Skip to content' })).toHaveFocus()
  })
})

describe('Site menu', () => {
  it('opens and closes with Escape, returning focus to the toggle', async () => {
    const user = userEvent.setup()
    render(<App />)

    const toggle = screen.getByRole('button', { name: 'Open menu' })
    expect(toggle).toHaveAttribute('aria-expanded', 'false')

    await user.click(toggle)
    expect(toggle).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByRole('navigation', { name: 'Sections' })).toBeVisible()

    await user.keyboard('{Escape}')
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
    expect(toggle).toHaveFocus()
  })

  it('closes when clicking outside it', async () => {
    const user = userEvent.setup()
    render(<App />)

    const toggle = screen.getByRole('button', { name: 'Open menu' })
    await user.click(toggle)
    await user.click(screen.getByRole('main'))
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
  })
})

describe('Theme toggle', () => {
  it('switches between dark and light and labels the next theme', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: 'Switch to light theme' }))
    expect(document.documentElement.dataset.theme).toBe('light')

    await user.click(await screen.findByRole('button', { name: 'Switch to dark theme' }))
    expect(document.documentElement.dataset.theme).toBe('dark')
  })
})

describe('Command palette', () => {
  it('opens with Ctrl+K, filters, and jumps to the chosen section', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.keyboard('{Control>}k{/Control}')
    const dialog = await screen.findByRole('dialog')
    expect(within(dialog).getByRole('option', { name: /Case files/ })).toBeInTheDocument()

    await user.keyboard('toolkit')
    expect(within(dialog).queryByRole('option', { name: /Case files/ })).not.toBeInTheDocument()

    await user.keyboard('{Enter}')
    await vi.waitFor(() => expect(window.location.hash).toBe('#toolkit'))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('opens from the menu', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: 'Open menu' }))
    await user.click(screen.getByRole('button', { name: /command palette$/i }))
    expect(await screen.findByRole('dialog')).toBeInTheDocument()
  })
})
