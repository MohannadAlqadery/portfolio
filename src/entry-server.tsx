/**
 * Server entry used only at build time by scripts/prerender.ts.
 * Renders the notes pages and the 404 page to static HTML so crawlers and link previews see real
 * content. The same <App> tree as the browser is rendered, with the route pages passed eagerly,
 * so the client can hydrate the markup instead of replacing it.
 */
import { StrictMode } from 'react'
import { renderToString } from 'react-dom/server'
import App, { type RoutePages } from '@/App'
import { NOT_FOUND_TITLE, NOTES_DESCRIPTION, NOTES_TITLE, noteTitle } from '@/features/notes/meta'
import NotePage from '@/features/notes/NotePage'
import NotesIndexPage from '@/features/notes/NotesIndexPage'
import { notePath, notes } from '@/features/notes/notes'
import { setServerPath } from '@/lib/router'
import NotFoundPage from '@/pages/NotFoundPage'

export type PrerenderPage = {
  /** URL path, e.g. /notes/sc-200-field-notes */
  path: string
  /** Output file relative to dist/, e.g. notes/sc-200-field-notes.html */
  file: string
  title: string
  description: string
  ogType: 'website' | 'article'
  /** Include in sitemap.xml */
  indexable: boolean
  lastmod?: string
  article?: { headline: string; datePublished: string; keywords: string[] }
  html: string
}

const eagerPages: RoutePages = { NotesIndexPage, NotePage, NotFoundPage }

function render(path: string): string {
  setServerPath(path)
  return renderToString(
    <StrictMode>
      <App pages={eagerPages} />
    </StrictMode>,
  )
}

export function renderPages(): PrerenderPage[] {
  const latest = notes[0]?.date

  return [
    {
      path: '/notes',
      // Flat .html files: served at the clean URL by Vercel (`cleanUrls`) and by `vite preview`.
      file: 'notes.html',
      title: NOTES_TITLE,
      description: NOTES_DESCRIPTION,
      ogType: 'website',
      indexable: true,
      ...(latest ? { lastmod: latest } : {}),
      html: render('/notes'),
    },
    ...notes.map<PrerenderPage>((note) => ({
      path: notePath(note.slug),
      file: `notes/${note.slug}.html`,
      title: noteTitle(note),
      description: note.description,
      ogType: 'article',
      indexable: true,
      lastmod: note.date,
      article: { headline: note.title, datePublished: note.date, keywords: note.tags },
      html: render(notePath(note.slug)),
    })),
    {
      path: '/404',
      file: '404.html',
      title: NOT_FOUND_TITLE,
      description: 'This page does not exist.',
      ogType: 'website',
      indexable: false,
      html: render('/404'),
    },
  ]
}
