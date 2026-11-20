import { AxeBuilder } from '@axe-core/playwright'
import { expect, test } from './fixtures.ts'

const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']

test.describe('home page', () => {
  test('renders every section without console errors or CSP violations', async ({
    page,
    consoleErrors,
  }) => {
    await page.goto('/')
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(/Mohannad\s+Alqadery/)
    for (const id of ['profile', 'cases', 'credentials', 'toolkit', 'education', 'contact']) {
      await expect(page.locator(`section#${id}`)).toBeAttached()
    }
    expect(consoleErrors).toEqual([])
  })

  test('has no automatically detectable accessibility violations', async ({ page }) => {
    await page.goto('/')
    // Wait for the hero to settle; the open case sheet is part of the audit.
    await expect(page.getByRole('heading', { level: 2, name: /Hi, I’m/ })).toBeAttached()
    await expect(page.getByRole('heading', { level: 3, name: 'SOC L1 Analyst' })).toBeAttached()

    const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze()
    expect(results.violations.map((v) => `${v.id}: ${v.help} (${v.nodes.length})`)).toEqual([])
  })

  test('command palette is accessible and jumps to a section', async ({ page, isMobile }) => {
    test.skip(isMobile, 'Keyboard feature: the palette button is hidden on phones')
    await page.goto('/')
    await page.keyboard.press('ControlOrMeta+k')
    const dialog = page.getByRole('dialog', { name: 'Command palette' })
    await expect(dialog).toBeVisible()

    const results = await new AxeBuilder({ page })
      .include('[role="dialog"]')
      .withTags(WCAG_TAGS)
      .analyze()
    expect(results.violations.map((v) => v.id)).toEqual([])

    await page.keyboard.type('toolkit')
    await page.keyboard.press('Enter')
    await expect(dialog).toBeHidden()
    await expect(page).toHaveURL(/#toolkit$/)
    await expect(page.locator('#toolkit')).toBeInViewport()
  })

  test('contact email stays hidden until revealed', async ({ page }) => {
    await page.goto('/')
    const html = await page.content()
    expect(html).not.toContain('mohannadalqadery@gmail.com')

    await page.getByRole('button', { name: 'Reveal address' }).click()
    await expect(page.getByRole('link', { name: 'Write' })).toHaveAttribute(
      'href',
      'mailto:mohannadalqadery@gmail.com',
    )
  })

  test('case folders open into the case sheet, and papers lift on hover', async ({
    page,
    isMobile,
  }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' })
    await page.goto('/#cases')
    const intern = page.getByRole('button', { name: /Cybersecurity Intern/ })
    await intern.scrollIntoViewIfNeeded()

    if (!isMobile) {
      // The light report page rises out of the folder on hover.
      const paper = intern.locator('[aria-hidden="true"] > div').last()
      const restY = (await paper.boundingBox())?.y ?? 0
      await intern.hover()
      await expect.poll(async () => (await paper.boundingBox())?.y ?? 0).toBeLessThan(restY - 5)
    }

    await intern.click()
    await expect(intern).toHaveAttribute('aria-expanded', 'true')
    await expect(
      page.getByRole('heading', { level: 3, name: 'Cybersecurity Intern' }),
    ).toBeVisible()
    await expect(page.getByRole('heading', { level: 3, name: 'SOC L1 Analyst' })).toHaveCount(0)
  })
})

test.describe('site menu', () => {
  test('menu opens from the pill, navigates and closes', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: 'Open menu' }).click()

    const menu = page.getByRole('navigation', { name: 'Sections' })
    await expect(menu).toBeVisible()
    await menu.getByRole('link', { name: /Credentials/ }).click()

    await expect(menu).toBeHidden()
    await expect(page.locator('#credentials')).toBeInViewport()
  })

  test('has no horizontal overflow', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'mobile only')
    await page.goto('/')
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    )
    expect(overflow).toBeLessThanOrEqual(0)
  })
})
