import { AxeBuilder } from '@axe-core/playwright'
import { expect, test } from './fixtures.ts'

const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']

test.describe('night-shift city footer', () => {
  test('loads only near the footer, then lets you triage an alert', async ({ page }) => {
    const chunk = (url: string) => /NightShiftCity-[\w-]+\.js$/.test(url)
    const requested: string[] = []
    page.on('request', (r) => requested.push(r.url()))

    await page.goto('/')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    // Not downloaded while the footer is far away.
    expect(requested.some(chunk)).toBe(false)

    await page.locator('footer').scrollIntoViewIfNeeded()
    const city = page.getByTestId('night-city')
    await expect(city).toBeVisible()
    expect((await city.boundingBox())?.height ?? 0).toBeGreaterThan(150)
    await expect(page.getByText(/Night shift · \d+ hosts/)).toBeVisible()

    // An alert comes in; triage it from the keyboard-accessible button.
    const triage = page.getByRole('button', { name: /Triage alert/ })
    await expect(triage).toBeVisible({ timeout: 10_000 })
    await triage.click()
    const card = page.getByRole('dialog')
    await expect(card).toBeVisible()
    await expect(card).toBeFocused()
    await expect(card.getByText(/^CASE-\d{4}-\d{4} · (WS|SRV)-ADH-/)).toBeVisible()
    await expect(card.getByText(/T\d{4}/)).toBeVisible()

    // Three checks, then the verdict, and the shift log counts it.
    await expect(card.getByRole('listitem').filter({ hasText: /:/ }).last()).toContainText(
      /^(Escalated|Benign|False positive): /,
    )
    await expect(page.getByText(/Triaged 1 · Escalated [01]/)).toBeVisible()

    const results = await new AxeBuilder({ page }).include('footer').withTags(WCAG_TAGS).analyze()
    expect(results.violations.map((v) => `${v.id} (${v.nodes.length})`)).toEqual([])

    // Escape closes it and puts focus back on the button.
    await page.keyboard.press('Escape')
    await expect(card).toBeHidden()
    await expect(triage.or(page.getByRole('button', { name: 'All quiet' }))).toBeFocused()
  })

  test('tapping a quiet building shows its host card', async ({ page }) => {
    await page.goto('/')
    await page.locator('footer').scrollIntoViewIfNeeded()
    const city = page.getByTestId('night-city')
    await expect(city).toBeVisible()
    const box = await city.boundingBox()
    if (!box) throw new Error('no city')

    // Tap low down, where every column has a building, until one opens a host card.
    for (const fraction of [0.15, 0.35, 0.55, 0.75]) {
      await city.click({ position: { x: box.width * fraction, y: box.height - 6 } })
      if (await page.getByRole('dialog').isVisible()) break
    }
    const card = page.getByRole('dialog')
    await expect(card).toBeVisible()
    await expect(card.getByText(/(WS|SRV)-ADH-/)).toBeVisible()

    // A tap outside closes it.
    await page.getByRole('heading', { level: 1 }).click({ force: true })
    await expect(card).toBeHidden()
  })

  test('reserves its space, so the page does not shift when it appears', async ({ page }) => {
    await page.goto('/')
    const footer = page.locator('footer')
    const before = (await footer.boundingBox())?.height ?? 0
    await footer.scrollIntoViewIfNeeded()
    await expect(page.getByTestId('night-city')).toBeVisible()
    expect((await footer.boundingBox())?.height).toBe(before)
  })
})
