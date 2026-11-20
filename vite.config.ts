/// <reference types="vitest/config" />
import { readFileSync } from 'node:fs'
import { fileURLToPath, URL } from 'node:url'
import mdx from '@mdx-js/rollup'
import rehypeShiki from '@shikijs/rehype'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import remarkFrontmatter from 'remark-frontmatter'
import remarkGfm from 'remark-gfm'
import remarkMdxFrontmatter from 'remark-mdx-frontmatter'
import { createCssVariablesTheme } from 'shiki'
import { defineConfig } from 'vite'
import { fontPreload } from './build/font-preload.ts'
import { remarkReadingTime } from './build/remark-reading-time.ts'
import { seo } from './build/seo.ts'
import { resolveSiteUrl } from './build/site-url.ts'

const readJson = <T>(path: string): T =>
  JSON.parse(readFileSync(new URL(path, import.meta.url), 'utf8')) as T

const pkg = readJson<{ version: string }>('./package.json')

type VercelConfig = {
  headers: { source: string; headers: { key: string; value: string }[] }[]
}

/**
 * Site-wide security headers from vercel.json, reused by `vite preview` so local and e2e runs
 * exercise the exact CSP that production serves.
 */
const securityHeaders = Object.fromEntries(
  (
    readJson<VercelConfig>('./vercel.json').headers.find((h) => h.source === '/(.*)')?.headers ?? []
  ).map((h) => [h.key, h.value]),
)

// Vercel exposes the commit SHA at build time; fall back to "local" for dev builds.
const buildSha = (process.env.VERCEL_GIT_COMMIT_SHA ?? process.env.GITHUB_SHA ?? 'local').slice(
  0,
  7,
)

const siteUrl = resolveSiteUrl()
const buildDate = new Date()

// Code blocks are highlighted at build time; colours come from CSS variables (see index.css).
const shikiTheme = createCssVariablesTheme({
  name: 'site',
  variablePrefix: '--shiki-',
  fontStyle: true,
})

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    // MDX must run before the React plugin so its JSX output is transformed like any .tsx file.
    {
      enforce: 'pre',
      ...mdx({
        remarkPlugins: [
          remarkGfm,
          remarkFrontmatter,
          remarkReadingTime,
          [remarkMdxFrontmatter, { name: 'frontmatter' }],
        ],
        rehypePlugins: [
          [
            rehypeShiki,
            {
              theme: shikiTheme,
              langs: ['kql', 'spl', 'bash', 'powershell', 'yaml'],
              fallbackLanguage: 'text',
              addLanguageClass: true,
            },
          ],
        ],
      }),
    },
    react({ include: /\.(mdx|js|jsx|ts|tsx)$/ }),
    tailwindcss(),
    seo({ siteUrl, buildDate }),
    // Display headline, body text and mono labels are all above the fold.
    fontPreload([
      /archivo-latin-wdth-normal-.*\.woff2$/,
      /geist-latin-wght-normal-.*\.woff2$/,
      /geist-mono-latin-wght-normal-.*\.woff2$/,
    ]),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
    __BUILD_SHA__: JSON.stringify(buildSha),
    __BUILD_DATE__: JSON.stringify(buildDate.toISOString().slice(0, 10)),
  },
  preview: {
    port: 4173,
    strictPort: true,
    headers: securityHeaders,
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    css: true,
    restoreMocks: true,
  },
})
