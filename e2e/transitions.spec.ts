import { expect, test } from './fixtures.ts'

test.describe('page transitions', () => {
  test('the menu preloads the notes, and picking them swaps pages in one smooth transition', async ({
    page,
    consoleErrors,
  }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' })
    const requested: string[] = []
    page.on('request', (r) => requested.push(r.url()))
    await page.goto('/')
    await expect(page.locator('html')).toHaveAttribute('data-hydrated', 'true')

    // Record every page-transition start and whether a loading placeholder ever appears.
    await page.evaluate(() => {
      const w = window as unknown as { transitions: number; placeholder: boolean }
      w.transitions = 0
      w.placeholder = false
      new MutationObserver(() => {
        if (document.documentElement.hasAttribute('data-page-transition')) w.transitions++
        if (document.querySelector('main > [class*="min-h-[70svh]"]')) w.placeholder = true
      }).observe(document.documentElement, { attributes: true, childList: true, subtree: true })
    })

    await page.getByRole('button', { name: 'Open menu' }).click()
    // Opening the menu starts loading the notes page.
    await expect.poll(() => requested.some((u) => /NotesIndexPage-[\w-]+\.js$/.test(u))).toBe(true)

    await page
      .getByRole('navigation', { name: 'Sections' })
      .getByRole('link', { name: /Field notes/ })
      .click()
    await expect(page).toHaveURL(/\/notes$/)
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(/Field\s+notes/)
    const seen = await page.evaluate(() => {
      const w = window as unknown as { transitions: number; placeholder: boolean }
      return { transitions: w.transitions, placeholder: w.placeholder }
    })
    expect(seen.transitions).toBeGreaterThan(0)
    expect(seen.placeholder).toBe(false)
    // The new page starts at the top.
    expect(await page.evaluate(() => scrollY)).toBe(0)

    // Back goes home with a transition too, and the page still works.
    await page.goBack()
    await expect(page).toHaveURL(/\/$/)
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Mohannad Alqadery')
    expect(consoleErrors).toEqual([])
  })

  test('switches instantly with Reduce Motion', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('html')).toHaveAttribute('data-hydrated', 'true')
    await page.getByRole('button', { name: 'Open menu' }).click()
    await page
      .getByRole('navigation', { name: 'Sections' })
      .getByRole('link', { name: /Field notes/ })
      .click()
    await expect(page).toHaveURL(/\/notes$/)
    await expect(page.locator('html')).not.toHaveAttribute('data-page-transition')
  })
})

test.describe('accent colour', () => {
  test('green appears only on "Active" status, on every page', async ({ page }) => {
    for (const path of ['/', '/notes', '/notes/sc-200']) {
      await page.goto(path)
      await expect(page.locator('html')).toHaveAttribute('data-hydrated', 'true')
      // Walk the page so lazy parts (footer field) mount.
      const height = await page.evaluate(() => document.documentElement.scrollHeight)
      for (let y = 0; y < height; y += 700) await page.evaluate((v) => window.scrollTo(0, v), y)
      await page.waitForTimeout(300)

      const offenders = await page.evaluate(() => {
        const probe = document.createElement('span')
        probe.style.color = 'var(--color-signal)'
        document.body.append(probe)
        const green = getComputedStyle(probe).color
        probe.remove()
        const props = ['color', 'backgroundColor', 'borderTopColor', 'outlineColor'] as const
        return (
          [...document.querySelectorAll('body *')]
            .filter((el) => {
              const style = getComputedStyle(el)
              if (style.visibility === 'hidden' || style.display === 'none') return false
              return props.some((p) => {
                if (style[p] !== green) return false
                // Borders and outlines only count when they are actually drawn.
                if (p === 'borderTopColor') return parseFloat(style.borderTopWidth) > 0
                if (p === 'outlineColor') return style.outlineStyle !== 'none'
                if (p === 'color')
                  return (el.textContent ?? '').trim() !== '' || el.childElementCount === 0
                return true
              })
            })
            // A status dot is fine when the nearest ancestor with text says "Active".
            .filter((el) => {
              let node: Element | null = el
              while (node && (node.textContent ?? '').trim() === '') node = node.parentElement
              return !/\bactive\b/i.test(node?.textContent ?? '')
            })
            .map((el) => `${el.tagName}.${String(el.className).slice(0, 60)}`)
        )
      })
      expect(offenders, `green outside "Active" on ${path}`).toEqual([])
    }
  })
})
