import type { Plugin } from 'vite'
import { education } from '../src/content/education.ts'
import { site } from '../src/content/site.ts'

type SeoOptions = {
  /** Absolute origin without trailing slash, e.g. https://example.com */
  siteUrl: string
  /** Build date, used for sitemap lastmod and security.txt expiry. */
  buildDate: Date
}

/** JSON-LD Person, generated from the same content the page renders. No email or phone. */
export function personJsonLd(siteUrl: string): string {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: site.name,
    url: `${siteUrl}/`,
    jobTitle: site.role,
    worksFor: { '@type': 'Organization', name: 'REACH Digital' },
    address: {
      '@type': 'PostalAddress',
      addressLocality: site.location.city,
      addressCountry: 'AE',
    },
    alumniOf: { '@type': 'CollegeOrUniversity', name: education.school },
    knowsLanguage: ['ar', 'en'],
    sameAs: [site.links.linkedin],
  }
  // Escape "<" so the JSON can never close the surrounding <script> element.
  return JSON.stringify(data).replace(/</g, '\\u003c')
}

/**
 * - Replaces `%SITE_URL%` in index.html (canonical, Open Graph URLs).
 * - Injects JSON-LD structured data.
 * - Emits robots.txt and /.well-known/security.txt at build time (client build only).
 */
export function seo({ siteUrl, buildDate }: SeoOptions): Plugin {
  const expires = new Date(buildDate)
  expires.setUTCFullYear(expires.getUTCFullYear() + 1)

  return {
    name: 'portfolio-seo',
    apply: (_config, env) => !env.isSsrBuild,
    transformIndexHtml: {
      order: 'pre',
      handler(html) {
        return {
          html: html.replaceAll('%SITE_URL%', siteUrl),
          tags: [
            {
              tag: 'script',
              attrs: { type: 'application/ld+json' },
              children: personJsonLd(siteUrl),
              injectTo: 'head',
            },
          ],
        }
      },
    },
    generateBundle() {
      this.emitFile({
        type: 'asset',
        fileName: 'robots.txt',
        source: `User-agent: *\nAllow: /\n\nSitemap: ${siteUrl}/sitemap.xml\n`,
      })
      // sitemap.xml is written by scripts/prerender.ts, which knows every route (home + notes).
      // RFC 9116. Contact points at LinkedIn so the email stays off plain-text files.
      this.emitFile({
        type: 'asset',
        fileName: '.well-known/security.txt',
        source: [
          `Contact: ${site.links.linkedin}`,
          `Expires: ${expires.toISOString()}`,
          'Preferred-Languages: en, ar',
          `Canonical: ${siteUrl}/.well-known/security.txt`,
          '',
        ].join('\n'),
      })
    },
  }
}
