/// <reference types="vitest/config" />
import { readFileSync } from 'node:fs'
import { fileURLToPath, URL } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { fontPreload } from './build/font-preload.ts'
import { seo } from './build/seo.ts'

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

// Absolute origin for canonical / Open Graph URLs. SITE_URL wins; otherwise Vercel's production URL.
const siteUrl = (
  process.env.SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : 'http://localhost:4173')
).replace(/\/$/, '')

const buildDate = new Date()

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    seo({ siteUrl, buildDate }),
    // Hero name (serif, both styles) and body text are above the fold.
    fontPreload([
      /instrument-serif-latin-400-normal-.*\.woff2$/,
      /instrument-serif-latin-400-italic-.*\.woff2$/,
      /geist-latin-wght-normal-.*\.woff2$/,
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
