import { AxeBuilder } from '@axe-core/playwright'
import { expect, test } from './fixtures.ts'

const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']
const NOTE = '/notes/sc-200-field-notes'

test.describe('field notes', () => {
  test('note pages are pre-rendered with their own metadata', async ({ request }) => {
    const html = await (await request.get(NOTE)).text()
    // Content is in the HTML itself, before any JavaScript runs.
    expect(html).toMatch(/<h1[^>]*>SC-200 field notes/)
    expect(html).toContain('SigninLogs')
    expect(html).toMatch(/<title>SC-200 field notes[^<]*<\/title>/)
    expect(html).toMatch(/property="og:type" content="article"/)
    expect(html).toMatch(/rel="canonical" href="https?:\/\/[^"]+\/notes\/sc-200-field-notes"/)
    expect(html).toContain('"@type":"BlogPosting"')
  })

  test('hydrate without errors and pass an accessibility audit', async ({ page }) => {
    for (const path of ['/notes', NOTE, '/notes/ejpt-field-notes', '/notes/esoc-field-notes']) {
      await page.goto(path)
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
      const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze()
      expect(results.violations.map((v) => `${path} ${v.id} (${v.nodes.length})`)).toEqual([])
    }
    // The consoleErrors fixture fails the test on any hydration mismatch or CSP violation.
  })

  test('list filters by tag and opens a note', async ({ page }) => {
    await page.goto('/notes')
    const list = page.getByRole('list', { name: 'Notes' })
    await expect(list.getByRole('listitem')).toHaveCount(3)

    await page.getByRole('button', { name: 'KQL', exact: true }).click()
    await expect(list.getByRole('listitem')).toHaveCount(1)

    await page.getByRole('link', { name: /SC-200 field notes/ }).click()
    await expect(page).toHaveURL(/\/notes\/sc-200-field-notes$/)
    await expect(page).toHaveTitle(/SC-200 field notes/)
    await expect(page.getByRole('button', { name: 'Copy' }).first()).toBeVisible()
  })

  test('section links on a note page go back to the homepage section', async ({
    page,
    isMobile,
  }) => {
    await page.goto(NOTE)
    if (isMobile) {
      await page.getByRole('button', { name: 'Open menu' }).click()
      await page
        .getByRole('navigation', { name: 'Sections' })
        .getByRole('link', { name: /Case files/ })
        .click()
    } else {
      await page
        .getByRole('navigation', { name: 'Primary' })
        .getByRole('link', { name: /Case files/ })
        .click()
    }
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
    for (const slug of ['sc-200-field-notes', 'ejpt-field-notes', 'esoc-field-notes']) {
      expect(sitemap).toContain(`/notes/${slug}</loc>`)
    }
  })
})
