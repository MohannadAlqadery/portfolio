/**
 * Absolute origin (no trailing slash) for canonical, Open Graph and sitemap URLs.
 * SITE_URL wins; otherwise Vercel's production URL; otherwise the local preview server.
 * Shared by vite.config.ts and the pre-render script so they always agree.
 */
export function resolveSiteUrl(env: NodeJS.ProcessEnv = process.env): string {
  const url =
    env.SITE_URL ??
    (env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${env.VERCEL_PROJECT_PRODUCTION_URL}`
      : 'http://localhost:4173')
  return url.replace(/\/$/, '')
}
