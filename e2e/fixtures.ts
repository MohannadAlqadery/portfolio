import { test as base, expect } from '@playwright/test'

/**
 * `page` that records console errors and uncaught exceptions (CSP violations surface as console
 * errors), and fails the test if any occurred.
 */
export const test = base.extend<{ consoleErrors: string[] }>({
  consoleErrors: async ({ page }, use) => {
    const errors: string[] = []
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(message.text())
    })
    page.on('pageerror', (error) => errors.push(error.message))
    await use(errors)
    expect(errors, 'console errors or CSP violations').toEqual([])
  },
})

export { expect }
