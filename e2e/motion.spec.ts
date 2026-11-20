import { expect, test } from './fixtures.ts'

/**
 * Open/close motion for the command palette and the pill menu. The suite runs with reduced
 * motion by default; these tests opt back in to check the animations exist, and that the
 * reduced-motion path skips them.
 */
test.describe('open and close motion', () => {
  test('Ctrl K palette animates in and out, on desktop and phone', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' })
    await page.goto('/')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()

    await page.keyboard.press('ControlOrMeta+k')
    const dialog = page.getByRole('dialog', { name: 'Command palette' })
    await expect(dialog).toBeVisible()
    await expect(dialog).toHaveCSS('animation-name', 'panel-in')
    await expect(dialog.getByRole('combobox')).toBeFocused()

    // Closing plays the exit animation before the dialog is removed.
    await page.keyboard.press('Escape')
    await expect(dialog).toHaveAttribute('data-state', 'closed')
    await expect(dialog).toHaveCSS('animation-name', 'panel-out')
    await expect(dialog).toHaveCount(0)

    // It opens again just as smoothly.
    await page.keyboard.press('ControlOrMeta+k')
    await expect(dialog).toHaveCSS('animation-name', 'panel-in')
  })

  test('the pill nav does not shift when Ctrl K locks scrolling', async ({
    playwright,
    baseURL,
    isMobile,
  }) => {
    test.skip(isMobile, 'desktop scrollbars only')
    // Headless browsers hide scrollbars by default; real desktop ones take up space.
    const browser = await playwright.chromium.launch({ ignoreDefaultArgs: ['--hide-scrollbars'] })
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
    await page.goto(baseURL ?? '/')
    const gap = await page.evaluate(() => window.innerWidth - document.documentElement.clientWidth)
    expect(gap).toBeGreaterThan(0)

    const logoX = () =>
      page
        .locator('header a')
        .first()
        .evaluate((el) => el.getBoundingClientRect().x)
    const before = await logoX()
    await page.keyboard.press('ControlOrMeta+k')
    await expect(page.getByRole('dialog', { name: 'Command palette' })).toBeVisible()
    expect(await logoX()).toBe(before)
    await page.keyboard.press('Escape')
    await expect(page.getByRole('dialog', { name: 'Command palette' })).toHaveCount(0)
    expect(await logoX()).toBe(before)
    await browser.close()
  })

  test('palette skips the animation with Reduce Motion', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await page.keyboard.press('ControlOrMeta+k')
    const dialog = page.getByRole('dialog', { name: 'Command palette' })
    await expect(dialog).toBeVisible()
    await expect(dialog).toHaveCSS('animation-duration', /^0\.00001s|^1e-05s|^0s/)
  })

  test('pill menu drops in, staggers its links, and leaves', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' })
    await page.goto('/')
    const nav = page.getByRole('navigation', { name: 'Sections' })
    // Closed: not rendered at all.
    await expect(nav).toHaveCount(0)

    await page.getByRole('button', { name: 'Open menu' }).click()
    const panel = page.locator('[id]:has(> nav[aria-label="Sections"])')
    // Mid-animation the panel is still fading and blurred in...
    await expect
      .poll(() => panel.evaluate((el) => Number(getComputedStyle(el).opacity)))
      .toBeLessThan(1)
    // ...and settles fully visible, focus on the first link.
    await expect.poll(() => panel.evaluate((el) => getComputedStyle(el).opacity)).toBe('1')
    await expect(nav.getByRole('link').first()).toBeFocused()

    await page.getByRole('button', { name: 'Close menu' }).click()
    await expect(nav).toHaveCount(0)
  })

  test('hero card travels and tilts into the intro as you scroll', async ({ page, isMobile }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' })
    await page.goto('/')
    const card = page.locator('div:has(> span.sr-only:text("The initials MA"))').last()
    const intro = page.getByRole('heading', { level: 2, name: /Hi, I’m/ })
    const opacityOf = (el: typeof intro) =>
      el.evaluate((node) =>
        Number(getComputedStyle(node.parentElement?.parentElement ?? node).opacity),
      )

    const start = await card.boundingBox()
    expect(await opacityOf(intro)).toBeLessThan(0.1)

    // Halfway through the travel the card is turned in 3D.
    const range = await page.evaluate(() => {
      const scene = document.querySelector<HTMLElement>('section[aria-labelledby="hero-title"]')
      return (scene?.offsetHeight ?? 0) - innerHeight
    })
    await page.evaluate((y) => window.scrollTo(0, y), Math.round(range * 0.3))
    await expect
      .poll(() => card.evaluate((el) => getComputedStyle(el.parentElement ?? el).transform))
      .toMatch(/^matrix3d/)

    // At the end it has grown into its intro spot and the intro copy is shown.
    await page.evaluate((y) => window.scrollTo(0, y), range)
    await expect.poll(() => opacityOf(intro)).toBeGreaterThan(0.95)
    const end = await card.boundingBox()
    expect(end?.width ?? 0).toBeGreaterThan((start?.width ?? 0) * (isMobile ? 1 : 1.1))
  })

  test('hero is a plain, unpinned layout with Reduce Motion', async ({ page }) => {
    await page.goto('/')
    const scene = page.locator('section[aria-labelledby="hero-title"]')
    const height = (await scene.boundingBox())?.height ?? 0
    // No 250svh scroll runway: just the hero screen plus the intro.
    expect(height).toBeLessThan((page.viewportSize()?.height ?? 0) * 2.2)
    await expect(page.getByRole('heading', { level: 2, name: /Hi, I’m/ })).toBeVisible()
    await expect(page.getByText('The initials MA drawn in ASCII characters')).toBeAttached()
  })
})
