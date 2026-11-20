import { test as base, expect } from '@playwright/test'

/**
 * `page` that records console errors and uncaught exceptions (CSP violations surface as console
 * errors), and fails the test if any occurred.
 */
export const test = base.extend<{ consoleErrors: string[]; hydrated: void }>({
  /**
   * Pages are often pre-rendered HTML that only becomes interactive once React hydrates it. After
   * every `page.goto`, wait for the app's `<html data-hydrated>` marker, so tests never click
   * a control that isn't listening yet.
   */
  hydrated: [
    async ({ page }, use) => {
      const goto = page.goto.bind(page)
      page.goto = async (url, options) => {
        const response = await goto(url, options)
        await page
          .locator('html[data-hydrated]')
          .waitFor({ state: 'attached', timeout: 10_000 })
          .catch(() => {})
        return response
      }
      await use()
    },
    { auto: true },
  ],
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
