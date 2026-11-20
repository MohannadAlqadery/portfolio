import { AxeBuilder } from '@axe-core/playwright'
import { expect, test } from './fixtures.ts'

const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']

test.describe('ask terminal', () => {
  test('answers questions, runs commands and closes back to its button', async ({
    page,
    consoleErrors,
  }) => {
    const panelChunk = (url: string) => /TerminalPanel-[\w-]+\.js$/.test(url)
    const requested: string[] = []
    page.on('request', (r) => requested.push(r.url()))
    await page.goto('/')
    // The terminal code only loads when it is opened.
    expect(requested.some(panelChunk)).toBe(false)

    const ask = page.getByRole('button', { name: /^Ask/ })
    await ask.click()
    const terminal = page.getByRole('dialog', { name: /mohannad@soc/ })
    await expect(terminal).toBeVisible()
    const input = terminal.getByRole('textbox', { name: /Ask a question/ })
    await expect(input).toBeFocused()

    // A suggestion chip answers from the site's own content.
    await terminal.getByRole('button', { name: 'Which certifications?' }).click()
    await expect(terminal.getByRole('log')).toContainText('SC-200 · Microsoft Certified')

    // Typed commands work, and history comes back with the up arrow.
    await input.fill('tools kql')
    await input.press('Enter')
    await expect(terminal.getByRole('log')).toContainText(
      'KQL · Query and Scripting · used on shift',
    )
    await input.press('ArrowUp')
    await expect(input).toHaveValue('tools kql')

    // goto scrolls the page to the section.
    await input.fill('goto toolkit')
    await input.press('Enter')
    await expect(page.locator('#toolkit')).toBeInViewport()

    // Escape closes and returns focus to the button.
    await input.press('Escape')
    await expect(terminal).toHaveCount(0)
    await expect(ask).toBeFocused()
    expect(consoleErrors).toEqual([])
  })

  test('opens with the backtick key and passes an accessibility audit', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await page.keyboard.press('Backquote')
    const terminal = page.getByRole('dialog', { name: /mohannad@soc/ })
    await expect(terminal).toBeVisible()
    const results = await new AxeBuilder({ page }).include('dialog').withTags(WCAG_TAGS).analyze()
    expect(results.violations.map((v) => `${v.id}: ${v.help} (${v.nodes.length})`)).toEqual([])
  })
})
