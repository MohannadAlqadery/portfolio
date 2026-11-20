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

    // Tap along the water (each building's reflection is part of it) until a quiet host opens;
    // a building with an open alert opens its case instead, so skip those.
    const card = page.getByRole('dialog')
    for (const fraction of [0.05, 0.2, 0.35, 0.5, 0.65, 0.8, 0.95]) {
      await city.click({ position: { x: box.width * fraction, y: box.height - 6 } })
      if (await card.getByText('EDR').isVisible()) break
      await page.keyboard.press('Escape')
    }
    await expect(card).toBeVisible()
    await expect(card.getByText(/^(WS|SRV)-ADH-/)).toBeVisible()

    // The EDR heartbeat is live: "seen Ns ago" keeps changing.
    const seen = card.getByText(/^(\d+s ago|just now)$/)
    const first = await seen.textContent()
    await expect.poll(() => seen.textContent(), { timeout: 4000 }).not.toBe(first)

    // A tap outside closes it.
    await page.getByRole('heading', { level: 1 }).click({ force: true })
    await expect(card).toBeHidden()
  })

  test('keeps location out of the footer, and several cases open at once', async ({ page }) => {
    await page.goto('/')
    const footer = page.locator('footer')
    await footer.scrollIntoViewIfNeeded()
    await expect(footer.getByText(/^Night shift · \d+ hosts$/)).toBeVisible()
    // No location, coordinates or Base block in the footer.
    await expect(footer.getByText(/Abu Dhabi|Coordinates|24\.45/)).toHaveCount(0)

    // Alerts and incidents keep arriving while nobody triages: the queue grows past one.
    const triage = page.getByRole('button', { name: /Triage alert/ })
    await expect(triage).toHaveAccessibleName(/Triage alert [2-3]$/, { timeout: 20_000 })
  })

  test('the cursor is a pointer over hosts and a normal arrow elsewhere', async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, 'mouse cursors only')
    await page.goto('/')
    await page.locator('footer').scrollIntoViewIfNeeded()
    const city = page.getByTestId('night-city')
    await expect(city).toBeVisible()
    const box = await city.boundingBox()
    if (!box) throw new Error('no city')
    const cursorAt = async (fx: number, y: number) => {
      await page.mouse.move(box.x + box.width * fx, box.y + y)
      return city.evaluate((el) => getComputedStyle(el).cursor)
    }

    // The sky at the top is never clickable.
    expect(await cursorAt(0.5, 4)).toBe('auto')
    // Somewhere along the bottom row is a host.
    const cursors: string[] = []
    for (const fx of [0.05, 0.25, 0.35, 0.5, 0.55, 0.75, 0.95]) {
      cursors.push(await cursorAt(fx, box.height - 30))
    }
    expect(cursors).toContain('pointer')
    expect(cursors).not.toContain('crosshair')
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
