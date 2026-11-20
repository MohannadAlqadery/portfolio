import { AxeBuilder } from '@axe-core/playwright'
import type { Locator } from '@playwright/test'
import { expect, test } from './fixtures.ts'

const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']

/** Share of canvas pixels that are drawn (non-transparent). */
const inked = (canvas: Locator) =>
  canvas.evaluate((el: HTMLCanvasElement) => {
    const ctx = el.getContext('2d')
    if (!ctx) return 0
    const { data } = ctx.getImageData(0, 0, el.width, el.height)
    let on = 0
    for (let i = 3; i < data.length; i += 4) if ((data[i] ?? 0) > 0) on++
    return on / (el.width * el.height)
  })

test.describe('signal-field footer', () => {
  test('loads only near the footer, draws the wordmark and reacts to the pointer', async ({
    page,
    isMobile,
    consoleErrors,
  }) => {
    const chunk = (url: string) => /SignalField-[\w-]+\.js$/.test(url)
    const requested: string[] = []
    page.on('request', (r) => requested.push(r.url()))
    await page.emulateMedia({ reducedMotion: 'no-preference' })

    await page.goto('/')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    expect(requested.some(chunk)).toBe(false)

    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight))
    const field = page.locator('[data-signal-field]')
    const canvas = field.locator('canvas')
    await expect.poll(() => inked(canvas), { timeout: 5000 }).toBeGreaterThan(0.02)
    // Sized for the screen's pixel ratio (capped at 2x).
    const ratio = await canvas.evaluate(
      (el: HTMLCanvasElement) => el.width / el.getBoundingClientRect().width,
    )
    expect(ratio).toBeCloseTo(Math.min(await page.evaluate(() => devicePixelRatio), 2), 1)

    if (!isMobile) {
      const box = await field.boundingBox()
      await page.mouse.move(
        (box?.x ?? 0) + (box?.width ?? 0) / 2,
        (box?.y ?? 0) + (box?.height ?? 0) / 2,
      )
      await expect(field.getByText(/^x \d{4} · y \d{3}$/)).toBeVisible()
      await expect(field.getByText(/^rx \d+ pkt\/s · inspected \d+$/)).toBeVisible()
    }
    expect(consoleErrors).toEqual([])
  })

  test('draws one still frame with Reduce Motion', async ({ page }) => {
    await page.goto('/')
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight))
    const canvas = page.locator('[data-signal-field] canvas')
    await expect.poll(() => inked(canvas), { timeout: 5000 }).toBeGreaterThan(0.02)
    const a = await canvas.evaluate((el: HTMLCanvasElement) => el.toDataURL())
    await page.waitForTimeout(400)
    expect(await canvas.evaluate((el: HTMLCanvasElement) => el.toDataURL())).toBe(a)
  })

  test('shows the status strip and passes an accessibility audit', async ({ page }) => {
    await page.goto('/')
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight))
    const footer = page.getByRole('contentinfo')
    await expect(footer.getByText('All systems normal')).toBeVisible()
    await expect(footer.getByText('Finally, some traffic on my site.')).toBeVisible()
    await expect(footer.getByText('See you around.')).toBeVisible()
    const results = await new AxeBuilder({ page }).include('footer').withTags(WCAG_TAGS).analyze()
    expect(results.violations.map((v) => `${v.id}: ${v.help} (${v.nodes.length})`)).toEqual([])
  })
})
