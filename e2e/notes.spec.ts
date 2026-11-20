import { AxeBuilder } from '@axe-core/playwright'
import { expect, test } from './fixtures.ts'

const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']
const NOTE = '/notes/sc-200'
const ALL_NOTES = ['sc-200', 'ejptv2', 'esoc']

test.describe('field notes', () => {
  test('note pages are pre-rendered with their own metadata', async ({ request }) => {
    const html = await (await request.get(NOTE)).text()
    // Content is in the HTML itself, before any JavaScript runs.
    expect(html).toMatch(/<h1[^>]*>SC-200: a field guide/)
    expect(html).toContain('SigninLogs')
    expect(html).toContain('Key takeaways')
    expect(html).toMatch(/<title>SC-200: a field guide[^<]*<\/title>/)
    expect(html).toMatch(/property="og:type" content="article"/)
    expect(html).toMatch(/rel="canonical" href="https?:\/\/[^"]+\/notes\/sc-200"/)
    expect(html).toContain('"@type":"BlogPosting"')
  })

  test('hydrate without errors and pass an accessibility audit', async ({ page }) => {
    for (const path of ['/notes', ...ALL_NOTES.map((slug) => `/notes/${slug}`)]) {
      await page.goto(path)
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
      const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze()
      expect(results.violations.map((v) => `${path} ${v.id} (${v.nodes.length})`)).toEqual([])
    }
    // The consoleErrors fixture fails the test on any hydration mismatch or CSP violation.
  })

  test('one page per certification, filterable by tag', async ({ page }) => {
    await page.goto('/notes')
    const items = page.getByRole('list', { name: 'Notes' }).getByRole('listitem')
    await expect(items).toHaveCount(ALL_NOTES.length)
    // The list is pre-rendered HTML; filters work once React has hydrated it.
    await expect(page.locator('html')).toHaveAttribute('data-hydrated', 'true')

    await page.getByRole('button', { name: 'Phishing', exact: true }).click()
    await expect(items).toHaveCount(1)

    await items.getByRole('link').click()
    await expect(page).toHaveURL(/\/notes\/esoc$/)
    await expect(page.getByRole('button', { name: 'Copy' }).first()).toBeVisible()
  })

  test('list and Previous / Next follow the Credentials order', async ({ page }) => {
    await page.goto('/notes')
    await expect(page.getByText('Field notes · 3 certifications')).toBeVisible()
    const titles = page.getByRole('list', { name: 'Notes' }).getByRole('listitem').getByRole('link')
    await expect(titles.nth(0)).toContainText('SC-200')
    await expect(titles.nth(1)).toContainText('eJPTv2')
    await expect(titles.nth(2)).toContainText('eSOC')

    const more = page.getByRole('navigation', { name: 'More notes' })
    await page.goto('/notes/sc-200')
    await expect(more.getByRole('link')).toHaveCount(1)
    await expect(more.getByRole('link', { name: /Next.*eJPTv2/ })).toBeVisible()

    await page.goto('/notes/ejptv2')
    await expect(more.getByRole('link', { name: /Previous.*SC-200/ })).toBeVisible()
    await expect(more.getByRole('link', { name: /Next.*eSOC/ })).toBeVisible()

    await page.goto('/notes/esoc')
    await expect(more.getByRole('link')).toHaveCount(1)
    await expect(more.getByRole('link', { name: /Previous.*eJPTv2/ })).toBeVisible()
  })

  test('"On this page" jumps to a section', async ({ page, isMobile }) => {
    await page.goto('/notes/ejptv2')
    if (isMobile) {
      await page.getByText(/On this page · \d+ sections/).click()
    }
    const toc = page.getByRole('navigation', { name: 'On this page' })
    await toc.getByRole('link', { name: 'The SOC side: what every step leaves behind' }).click()
    await expect(page).toHaveURL(/#the-soc-side-what-every-step-leaves-behind$/)
    await expect(
      page.getByRole('heading', { level: 2, name: /The SOC side: what every step/ }),
    ).toBeInViewport()
  })

  test('"On this page" opens and closes as an animated disclosure on phones', async ({
    page,
    isMobile,
  }) => {
    test.skip(!isMobile, 'phones and tablets only')
    await page.emulateMedia({ reducedMotion: 'no-preference' })
    await page.goto('/notes/ejptv2')
    const toggle = page.getByRole('button', { name: /On this page · \d+ sections/ })
    const panel = page.locator(`#${await toggle.getAttribute('aria-controls')}`)

    await expect(toggle).toHaveAttribute('aria-expanded', 'false')
    await expect(panel).toHaveCSS('transition-property', /grid-template-rows/)
    // Closed: no height and out of the tab order / accessibility tree.
    expect((await panel.boundingBox())?.height ?? 0).toBeLessThan(1)
    await expect(panel).toHaveAttribute('inert', '')

    await toggle.click()
    await expect(toggle).toHaveAttribute('aria-expanded', 'true')
    await expect(panel).not.toHaveAttribute('inert')
    await expect.poll(async () => (await panel.boundingBox())?.height ?? 0).toBeGreaterThan(150)
    await expect(page.getByRole('navigation', { name: 'On this page' })).toBeVisible()

    // Picking a section closes the list first, then lands on the heading.
    await page
      .getByRole('navigation', { name: 'On this page' })
      .getByRole('link', { name: 'The method' })
      .click()
    await expect(toggle).toHaveAttribute('aria-expanded', 'false')
    await expect(page).toHaveURL(/#the-method$/)
    await expect(page.getByRole('heading', { level: 2, name: 'The method' })).toBeInViewport()
  })

  test('the pill nav floats at the top and stays put while reading', async ({ page }) => {
    await page.goto('/notes/esoc')
    const pill = page.getByRole('banner').locator('> div')
    const pillTop = async () => (await pill.boundingBox())?.y ?? NaN

    await expect(page.getByRole('banner')).toHaveCSS('position', 'fixed')
    const top = await pillTop()
    expect(top).toBeGreaterThan(0)
    // Content starts below it rather than underneath it.
    const h1 = (await page.getByRole('heading', { level: 1 }).boundingBox())?.y ?? 0
    const pillBottom = top + ((await pill.boundingBox())?.height ?? Infinity)
    expect(h1).toBeGreaterThan(pillBottom)

    await page.evaluate(() => window.scrollBy({ top: 1000, behavior: 'instant' }))
    expect(await pillTop()).toBe(top)
    // The reading progress is its own line at the very top edge.
    expect((await page.getByTestId('reading-progress').boundingBox())?.y).toBe(0)
  })

  test('the menu drops out of the pill without locking the page', async ({ page }) => {
    await page.goto('/notes/esoc')
    await page.mouse.wheel(0, 800)
    await page.getByRole('button', { name: 'Open menu' }).click()

    const nav = page.getByRole('navigation', { name: 'Sections' })
    await expect(nav).toBeVisible()
    const pill = await page.getByRole('banner').locator('> div > div').first().boundingBox()
    const panel = await page.locator('[id]:has(> nav[aria-label="Sections"])').boundingBox()
    expect(panel?.y ?? 0).toBeGreaterThan((pill?.y ?? 0) + (pill?.height ?? 0))
    await expect(page.locator('html')).not.toHaveCSS('overflow', 'hidden')

    await page.keyboard.press('Escape')
    await expect(nav).toHaveCount(0)
    await expect(page.getByRole('button', { name: 'Open menu' })).toBeFocused()
  })

  test('reading progress only shows on note pages', async ({ page }) => {
    await page.goto('/notes')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await expect(page.getByTestId('reading-progress')).toHaveCount(0)
    await page.goto('/notes/sc-200')
    await expect(page.getByTestId('reading-progress')).toHaveCount(1)
  })

  test('section links on a note page go back to the homepage section', async ({ page }) => {
    await page.goto(NOTE)
    await page.getByRole('button', { name: 'Open menu' }).click()
    await page
      .getByRole('navigation', { name: 'Sections' })
      .getByRole('link', { name: /Case files/ })
      .click()
    await expect(page).toHaveURL(/\/#cases$/)
    await expect(page.locator('#cases')).toBeInViewport()
  })

  test('unknown pages show the 404 view', async ({ page }) => {
    await page.goto('/this-page-does-not-exist')
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(/Signal\s+lost/)
    await page.getByRole('link', { name: 'Browse field notes' }).click()
    await expect(page).toHaveURL(/\/notes$/)
  })

  test('sitemap lists every note', async ({ request }) => {
    const sitemap = await (await request.get('/sitemap.xml')).text()
    for (const slug of ALL_NOTES) {
      expect(sitemap).toContain(`/notes/${slug}</loc>`)
    }
  })
})
