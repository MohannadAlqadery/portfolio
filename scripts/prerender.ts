/**
 * Post-build step: writes static HTML for the notes pages and 404, plus sitemap.xml.
 *
 *   vite build                                   → dist/ (client)
 *   vite build --ssr src/entry-server.tsx ...    → dist-ssr/entry-server.js
 *   node scripts/prerender.ts                    → dist/notes/**, dist/404.html, dist/sitemap.xml
 *
 * Each page reuses dist/index.html (so it keeps the hashed asset links, CSP-safe scripts and font
 * preloads) and swaps in its own title, description, canonical URL and Open Graph tags.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { resolveSiteUrl } from '../build/site-url.ts'

type PrerenderPage = {
  path: string
  file: string
  title: string
  description: string
  ogType: 'website' | 'article'
  indexable: boolean
  lastmod?: string
  article?: { headline: string; datePublished: string; keywords: string[] }
  html: string
}

const root = fileURLToPath(new URL('..', import.meta.url))
const dist = join(root, 'dist')
const siteUrl = resolveSiteUrl()
const today = new Date().toISOString().slice(0, 10)

const { renderPages } = (await import(
  pathToFileURL(join(root, 'dist-ssr', 'entry-server.js')).href
)) as { renderPages: () => PrerenderPage[] }

const template = readFileSync(join(dist, 'index.html'), 'utf8')

const escapeAttr = (value: string) =>
  value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

/**
 * Replace the `content` (or `href`) of the first tag that starts like `tag`, e.g.
 * 'meta name="description"'. Spaces match any whitespace, since index.html wraps long tags.
 */
function setAttr(html: string, tag: string, attr: 'content' | 'href', value: string): string {
  const tagPattern = tag.replace(/ /g, '\\s+')
  const re = new RegExp(`(<${tagPattern}[^>]*?\\s${attr}=")[^"]*(")`)
  if (!re.test(html)) throw new Error(`Template is missing <${tagPattern}>`)
  return html.replace(re, `$1${escapeAttr(value)}$2`)
}

function articleJsonLd(page: PrerenderPage, url: string): string {
  if (!page.article) return ''
  const data = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: page.article.headline,
    description: page.description,
    datePublished: page.article.datePublished,
    dateModified: page.lastmod ?? page.article.datePublished,
    keywords: page.article.keywords.join(', '),
    url,
    mainEntityOfPage: url,
    image: `${siteUrl}/og.png`,
    author: { '@type': 'Person', name: 'Mohannad Alqadery', url: `${siteUrl}/` },
  }
  const json = JSON.stringify(data).replace(/</g, '\\u003c')
  return `<script type="application/ld+json">${json}</script>`
}

function buildPage(page: PrerenderPage): string {
  const url = `${siteUrl}${page.path}`
  let html = template
  html = html.replace(/<title>[\s\S]*?<\/title>/, `<title>${escapeAttr(page.title)}</title>`)
  html = setAttr(html, 'meta name="description"', 'content', page.description)
  html = setAttr(html, 'link rel="canonical"', 'href', url)
  html = setAttr(html, 'meta property="og:url"', 'content', url)
  html = setAttr(html, 'meta property="og:type"', 'content', page.ogType)
  html = setAttr(html, 'meta property="og:title"', 'content', page.title)
  html = setAttr(html, 'meta property="og:description"', 'content', page.description)

  const extraHead = [
    articleJsonLd(page, url),
    page.indexable ? '' : '<meta name="robots" content="noindex" />',
  ]
    .filter(Boolean)
    .join('\n    ')
  if (extraHead) html = html.replace('</head>', `    ${extraHead}\n  </head>`)

  if (!html.includes('<div id="root"></div>')) throw new Error('Template is missing #root')
  return html.replace('<div id="root"></div>', `<div id="root">${page.html}</div>`)
}

const pages = renderPages()

for (const page of pages) {
  const out = join(dist, page.file)
  mkdirSync(dirname(out), { recursive: true })
  writeFileSync(out, buildPage(page))
}

const sitemapEntries = [
  { loc: `${siteUrl}/`, lastmod: today },
  ...pages
    .filter((page) => page.indexable)
    .map((page) => ({ loc: `${siteUrl}${page.path}`, lastmod: page.lastmod ?? today })),
]

writeFileSync(
  join(dist, 'sitemap.xml'),
  [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...sitemapEntries.map(
      (entry) => `  <url><loc>${entry.loc}</loc><lastmod>${entry.lastmod}</lastmod></url>`,
    ),
    '</urlset>',
    '',
  ].join('\n'),
)

console.warn(`Pre-rendered ${pages.length} pages and a sitemap with ${sitemapEntries.length} URLs.`)
