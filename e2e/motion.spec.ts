import { expect, test } from './fixtures.ts'

/**
 * Open/close motion for the command palette and the phone menu. The suite runs with reduced
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

  test('palette skips the animation with Reduce Motion', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await page.keyboard.press('ControlOrMeta+k')
    const dialog = page.getByRole('dialog', { name: 'Command palette' })
    await expect(dialog).toBeVisible()
    await expect(dialog).toHaveCSS('animation-duration', /^0\.00001s|^1e-05s|^0s/)
  })

  test('phone menu fades in with its links sliding up, and back out', async ({
    page,
    isMobile,
  }) => {
    test.skip(!isMobile, 'phones and tablets only')
    await page.emulateMedia({ reducedMotion: 'no-preference' })
    await page.goto('/')
    const sheet = page.locator('[id]:has(> * > nav[aria-label="Sections"])')

    // Closed: mounted (so it can animate) but invisible and inert.
    await expect(sheet).toBeHidden()
    await expect(sheet).toHaveAttribute('inert', '')

    await page.getByRole('button', { name: 'Open menu' }).click()
    await expect(sheet).toBeVisible()
    await expect(sheet).not.toHaveAttribute('inert')
    await expect(sheet).toHaveCSS('transition-property', /opacity/)
    // Links follow one after another.
    const items = sheet.getByRole('listitem')
    const delays = await items.evaluateAll((els) =>
      els.map((el) => getComputedStyle(el).transitionDelay),
    )
    expect(new Set(delays).size).toBe(delays.length)
    await expect(page.getByRole('navigation', { name: 'Sections' })).toBeVisible()

    await page.getByRole('button', { name: 'Close menu' }).click()
    await expect(sheet).toBeHidden()
    await expect(sheet).toHaveAttribute('inert', '')
  })
})
