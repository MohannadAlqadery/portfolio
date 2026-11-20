import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { getTheme, setTheme, THEME_STORAGE_KEY, toggleTheme } from './theme'

beforeEach(() => {
  document.head.innerHTML = '<meta name="theme-color" content="#0a0a0a" />'
})

afterEach(() => {
  delete document.documentElement.dataset.theme
  localStorage.clear()
})

describe('theme', () => {
  it('defaults to dark', () => {
    expect(getTheme()).toBe('dark')
  })

  it('applies light: attribute, colour scheme, browser chrome colour and storage', () => {
    setTheme('light')
    const root = document.documentElement
    expect(root.dataset.theme).toBe('light')
    expect(root.style.colorScheme).toBe('light')
    expect(document.querySelector('meta[name="theme-color"]')).toHaveAttribute('content', '#f4f4f2')
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('light')
  })

  it('forgets the stored choice when going back to the default', () => {
    setTheme('light')
    expect(toggleTheme()).toBe('dark')
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBeNull()
    expect(getTheme()).toBe('dark')
  })
})
