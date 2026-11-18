import type { MDXContent } from 'mdx/types'

export type NoteFrontmatter = {
  title: string
  description: string
  /** `YYYY-MM-DD` */
  date: string
  tags: string[]
  /**
   * Position in the notes list and the Previous / Next sequence (1 = first). Matches the order
   * of the Credentials section: SC-200, eJPTv2, eSOC.
   */
  order: number
  /** Optional certification the note relates to, e.g. "SC-200". */
  cert?: string
  draft?: boolean
  /** Added at build time by build/remark-reading-time.ts */
  readingMinutes: number
  /** `##` headings and their ids, added at build time (for "On this page"). */
  toc: { text: string; id: string }[]
}

export type Note = NoteFrontmatter & { slug: string; Content: MDXContent }

type NoteModule = { default: MDXContent; frontmatter: NoteFrontmatter }

const modules = import.meta.glob<NoteModule>('/src/content/notes/*.mdx', { eager: true })

function slugFromPath(path: string): string {
  return (
    path
      .split('/')
      .pop()
      ?.replace(/\.mdx$/, '') ?? path
  )
}

/** All publishable notes in their explicit `order`. Drafts only appear in development. */
export const notes: Note[] = Object.entries(modules)
  .map(([path, mod]) => ({ ...mod.frontmatter, slug: slugFromPath(path), Content: mod.default }))
  .filter((note) => import.meta.env.DEV || !note.draft)
  .sort((a, b) => a.order - b.order || a.title.localeCompare(b.title))

export function findNote(slug: string): Note | undefined {
  return notes.find((note) => note.slug === slug)
}

/** The notes before and after `slug` in reading order ("← Previous" / "Next →"). */
export function neighbours(slug: string): { previous: Note | undefined; next: Note | undefined } {
  const index = notes.findIndex((note) => note.slug === slug)
  if (index === -1) return { previous: undefined, next: undefined }
  return { previous: notes[index - 1], next: notes[index + 1] }
}

/** Number of certifications covered by the notes. */
export const certCount = new Set(notes.flatMap((note) => (note.cert ? [note.cert] : []))).size

export const allTags: string[] = [...new Set(notes.flatMap((note) => note.tags))].sort((a, b) =>
  a.localeCompare(b),
)

export const notePath = (slug: string) => `/notes/${slug}`
