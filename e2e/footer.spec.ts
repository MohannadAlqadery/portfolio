import { AxeBuilder } from '@axe-core/playwright'
import type { Page } from '@playwright/test'
import { expect, test } from './fixtures.ts'

const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']

const toBottom = (page: Page) =>
  page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight))

/** A cheap fingerprint of what the canvas shows: average colour of a sampled grid. */
const sample = (page: Page) =>
  page.locator('[data-city-watch] canvas').evaluate((canvas: HTMLCanvasElement) => {
    const ctx = canvas.getContext('2d')
    if (!ctx) return null
    const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height)
    let r = 0
    let g = 0
    let b = 0
    let n = 0
    for (let i = 0; i < data.length; i += 4 * 97) {
      r += data[i] ?? 0
      g += data[i + 1] ?? 0
      b += data[i + 2] ?? 0
      n++
    }
    return { r: r / n, g: g / n, b: b / n, width: canvas.width, css: canvas.clientWidth }
  })

test.describe('city watch footer', () => {
  test('loads only near the footer, then runs', async ({ page, consoleErrors }) => {
    const chunk = (url: string) => /CityWatch-[\w-]+\.js$/.test(url)
    const requested: string[] = []
    page.on('request', (r) => requested.push(r.url()))
    await page.emulateMedia({ reducedMotion: 'no-preference' })

    await page.goto('/')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    expect(requested.some(chunk)).toBe(false)

    await toBottom(page)
    const street = page.locator('[data-city-watch]')
    await expect(street).toHaveAttribute('data-paused', 'false')
    await expect(street).toHaveAttribute('data-scene', 'night')

    // Drawn at the device pixel ratio (capped at 2), so it stays sharp.
    const shot = await sample(page)
    const dpr = await page.evaluate(() => Math.min(window.devicePixelRatio || 1, 2))
    expect(shot?.width).toBe(Math.round((shot?.css ?? 0) * dpr))

    // The profiler checks passers-by's devices by itself.
    await expect
      .poll(async () => Number(await street.getAttribute('data-profiles')), { timeout: 6000 })
      .toBeGreaterThan(0)
    expect(consoleErrors).toEqual([])
  })

  test('is night in the dark theme and day in the light one', async ({ page }) => {
    await page.goto('/')
    await toBottom(page)
    const street = page.locator('[data-city-watch]')
    await expect(street).toHaveAttribute('data-scene', 'night')
    const night = await sample(page)

    await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'light'))
    await expect(street).toHaveAttribute('data-scene', 'day')
    const day = await sample(page)
    const brightness = (s: typeof night) => ((s?.r ?? 0) + (s?.g ?? 0) + (s?.b ?? 0)) / 3
    expect(brightness(day)).toBeGreaterThan(brightness(night) + 80)
  })

  test("its sky is the page's own background, in both themes", async ({ page }) => {
    await page.goto('/')
    await toBottom(page)
    const street = page.locator('[data-city-watch]')
    // Average of the top row's right half (the HUD sits top left): the page canvas colour.
    const skyMatchesPage = () =>
      street.locator('canvas').evaluate((canvas: HTMLCanvasElement) => {
        const ctx = canvas.getContext('2d')
        if (!ctx) return 999
        const { data } = ctx.getImageData(canvas.width / 2, 1, canvas.width / 2, 1)
        let sum = 0
        for (let i = 0; i < data.length; i += 4) sum += data[i] ?? 0
        const avg = sum / (data.length / 4)
        const probe = document.createElement('div')
        probe.style.color = 'var(--color-canvas)'
        document.body.append(probe)
        const canvasTone = Number(/\d+/.exec(getComputedStyle(probe).color)?.[0] ?? 0)
        probe.remove()
        return Math.abs(avg - canvasTone)
      })
    await expect(street).toHaveAttribute('data-scene', 'night')
    expect(await skyMatchesPage()).toBeLessThan(10)
    await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'light'))
    await expect(street).toHaveAttribute('data-scene', 'day')
    expect(await skyMatchesPage()).toBeLessThan(10)
  })

  test('stands still with Reduce Motion', async ({ page }) => {
    await page.goto('/')
    await toBottom(page)
    const street = page.locator('[data-city-watch]')
    await expect(street).toHaveAttribute('data-scene', 'night')
    await expect(street).toHaveAttribute('data-paused', 'true')
    const a = await sample(page)
    await page.waitForTimeout(500)
    expect(await sample(page)).toEqual(a)
  })

  test('takes no pointer input', async ({ page }) => {
    await page.goto('/')
    await toBottom(page)
    const street = page.locator('[data-city-watch]')
    await expect(street).toHaveCSS('pointer-events', 'none')
  })

  test('footer contents rise into place as it scrolls in', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' })
    await page.goto('/')
    const footer = page.getByRole('contentinfo')
    const inner = footer.locator('> div').first()
    const offset = () => inner.evaluate((el) => new DOMMatrix(getComputedStyle(el).transform).m42)

    await footer.evaluate((el) =>
      window.scrollTo(0, el.getBoundingClientRect().top + scrollY - innerHeight + 80),
    )
    await expect.poll(offset).toBeLessThan(-20)
    await toBottom(page)
    await expect.poll(async () => Math.abs(await offset())).toBeLessThan(0.5)
    await expect(footer.getByText('See you around.')).toBeVisible()
    await expect(footer.getByText('Finally, some traffic on my site.')).toBeVisible()
  })

  test('footer passes an accessibility audit', async ({ page }) => {
    await page.goto('/')
    await toBottom(page)
    await expect(page.locator('[data-city-watch]')).toBeAttached()
    const results = await new AxeBuilder({ page }).include('footer').withTags(WCAG_TAGS).analyze()
    expect(results.violations.map((v) => `${v.id}: ${v.help} (${v.nodes.length})`)).toEqual([])
  })
})
