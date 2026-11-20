import { AxeBuilder } from '@axe-core/playwright'
import { expect, test } from './fixtures.ts'

const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']

test.describe('traffic-crowd footer', () => {
  test('loads only near the footer, then walks and flags passers-by', async ({
    page,
    consoleErrors,
  }) => {
    const chunk = (url: string) => /TrafficCrowd-[\w-]+\.js$/.test(url)
    const requested: string[] = []
    page.on('request', (r) => requested.push(r.url()))
    await page.emulateMedia({ reducedMotion: 'no-preference' })

    await page.goto('/')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    // Neither the crowd code nor any figure is downloaded while the footer is far away.
    expect(requested.some(chunk)).toBe(false)
    expect(requested.some((u) => /peep-\d+-[\w-]+\.svg$/.test(u))).toBe(false)

    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight))
    const crowd = page.locator('[data-crowd]')
    await expect(crowd).toHaveAttribute('data-paused', 'false')

    // Figures are loaded images, and they move.
    const figure = crowd.locator('[data-walker]').nth(2)
    await expect(figure.locator('img')).toHaveJSProperty('complete', true)
    const x0 = (await figure.boundingBox())?.x ?? 0
    await page.waitForTimeout(600)
    expect((await figure.boundingBox())?.x).not.toBe(x0)

    // Detection boxes lock onto people.
    await expect(crowd.locator('[data-detection]').first()).toBeVisible({ timeout: 5000 })
    expect(consoleErrors).toEqual([])
  })

  test('stands still with Reduce Motion, one figure boxed', async ({ page }) => {
    await page.goto('/')
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight))
    const crowd = page.locator('[data-crowd]')
    await expect(crowd).toHaveAttribute('data-paused', 'true')
    await expect(crowd.locator('[data-detection]')).toHaveCount(1)
    const figure = crowd.locator('[data-walker]').nth(4)
    const x0 = (await figure.boundingBox())?.x
    await page.waitForTimeout(500)
    expect((await figure.boundingBox())?.x).toBe(x0)
  })

  test('footer contents rise into place as it scrolls in', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' })
    await page.goto('/')
    const footer = page.getByRole('contentinfo')
    const inner = footer.locator('> div').first()
    const offset = () => inner.evaluate((el) => new DOMMatrix(getComputedStyle(el).transform).m42)

    // Footer just entering from below: contents still lifted.
    await footer.evaluate((el) =>
      window.scrollTo(0, el.getBoundingClientRect().top + scrollY - innerHeight + 80),
    )
    await expect.poll(offset).toBeLessThan(-20)
    // Fully in view: settled.
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight))
    await expect.poll(offset).toBe(0)
    await expect(footer.getByText('See you around.')).toBeVisible()
    await expect(footer.getByText('Finally, some traffic on my site.')).toBeVisible()
  })

  test('footer passes an accessibility audit', async ({ page }) => {
    await page.goto('/')
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight))
    await expect(page.locator('[data-crowd]')).toBeAttached()
    const results = await new AxeBuilder({ page }).include('footer').withTags(WCAG_TAGS).analyze()
    expect(results.violations.map((v) => `${v.id}: ${v.help} (${v.nodes.length})`)).toEqual([])
  })
})
