import { expect, test } from '@playwright/test'

test.describe('security headers', () => {
  test('are served on the document', async ({ request }) => {
    const response = await request.get('/')
    const headers = response.headers()

    expect(headers['content-security-policy']).toContain("script-src 'self'")
    expect(headers['content-security-policy']).toContain("frame-ancestors 'none'")
    expect(headers['x-content-type-options']).toBe('nosniff')
    expect(headers['x-frame-options']).toBe('DENY')
    expect(headers['referrer-policy']).toBe('strict-origin-when-cross-origin')
    expect(headers['permissions-policy']).toContain('camera=()')
    expect(headers['cross-origin-opener-policy']).toBe('same-origin')
  })
})

test.describe('crawler and disclosure files', () => {
  test('robots.txt points at the sitemap', async ({ request }) => {
    const body = await (await request.get('/robots.txt')).text()
    expect(body).toMatch(/^Sitemap: https?:\/\/.+\/sitemap\.xml$/m)
  })

  test('sitemap.xml lists the home page', async ({ request }) => {
    const body = await (await request.get('/sitemap.xml')).text()
    expect(body).toContain('<urlset')
    expect(body).toMatch(/<loc>https?:\/\/[^<]+\/<\/loc>/)
  })

  test('security.txt follows RFC 9116 and expires in the future', async ({ request }) => {
    const body = await (await request.get('/.well-known/security.txt')).text()
    expect(body).toMatch(/^Contact: https:\/\//m)
    const expires = /^Expires: (.+)$/m.exec(body)?.[1]
    expect(new Date(expires ?? 0).getTime()).toBeGreaterThan(Date.now())
  })
})

test.describe('metadata', () => {
  test('has absolute social preview URLs and structured data', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle(/Mohannad Alqadery/)
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
      'content',
      // Versioned by content hash, so link previews refetch the card whenever it changes.
      /^https?:\/\/.+\/og\.png\?v=[0-9a-f]{8}$/,
    )
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', /^https?:\/\//)

    const jsonLd = await page.locator('script[type="application/ld+json"]').textContent()
    const person = JSON.parse(jsonLd ?? '{}') as Record<string, unknown>
    expect(person['@type']).toBe('Person')
    expect(JSON.stringify(person)).not.toMatch(/@gmail|\+971/)
  })
})
