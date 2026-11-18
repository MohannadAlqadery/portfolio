/**
 * Renders the social preview card and the Apple touch icon from the built site.
 *
 *   npm run og        (builds first, then runs this script)
 *
 * Output (committed): public/og.png (1200×630), public/apple-touch-icon.png (180×180)
 */
import { fileURLToPath } from 'node:url'
import { chromium } from '@playwright/test'
import { preview } from 'vite'

const root = fileURLToPath(new URL('..', import.meta.url))
const out = (file: string) => fileURLToPath(new URL(`../public/${file}`, import.meta.url))

const server = await preview({ root, preview: { port: 4179, strictPort: true } })
const origin = 'http://localhost:4179'
const browser = await chromium.launch()

try {
  const page = await browser.newPage({
    viewport: { width: 1200, height: 630 },
    reducedMotion: 'reduce',
  })
  await page.goto(`${origin}/#og`)
  await page.locator('#og-card').waitFor()
  await page.evaluate(() => document.fonts.ready)
  await page.locator('#og-card').screenshot({ path: out('og.png') })

  const icon = await browser.newPage({ viewport: { width: 180, height: 180 } })
  await icon.goto(`${origin}/favicon.svg`)
  await icon.screenshot({ path: out('apple-touch-icon.png'), omitBackground: true })

  console.warn('Wrote public/og.png and public/apple-touch-icon.png')
} finally {
  await browser.close()
  await new Promise<void>((resolve) => server.httpServer.close(() => resolve()))
}
