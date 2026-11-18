import { expect, test } from '@playwright/test'

type ShiftEntry = PerformanceEntry & { value: number; hadRecentInput: boolean }

test.describe('layout stability', () => {
  test('page does not shift when web fonts arrive late', async ({ page }) => {
    await page.addInitScript(() => {
      const w = window as unknown as { clsTotal: number }
      w.clsTotal = 0
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries() as ShiftEntry[]) {
          if (!entry.hadRecentInput) w.clsTotal += entry.value
        }
      }).observe({ type: 'layout-shift', buffered: true })
    })
    // Delay fonts so the metric-matched fallbacks render first, as on a slow connection.
    await page.route('**/*.woff2', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 600))
      await route.continue()
    })

    await page.goto('/')
    await page.evaluate(() => document.fonts.ready)
    await page.waitForTimeout(500)

    const cls = await page.evaluate(() => (window as unknown as { clsTotal: number }).clsTotal)
    expect(cls).toBeLessThan(0.05)
  })

  test('preloads the above-the-fold fonts', async ({ request }) => {
    const html = await (await request.get('/')).text()
    const preloads = html.match(/<link rel="preload"[^>]+as="font"[^>]*>/g) ?? []
    expect(preloads.length).toBe(3)
  })
})
