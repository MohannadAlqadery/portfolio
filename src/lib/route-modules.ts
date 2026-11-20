import { lazy, type ComponentType } from 'react'
import { matchRoute } from './router'

/**
 * Route code that loads on demand (notes index, note page), shared by the app and the router:
 * - `preloadRoute(path)` starts the download early (menu opened, link hovered) and the router
 *   waits for it before switching pages, so a transition never shows a loading gap;
 * - once a module has loaded, `routeComponent` hands back the real component instead of the
 *   `lazy()` wrapper, so React renders it immediately without suspending.
 */
type NotesIndex = ComponentType
type NotePage = ComponentType<{ slug: string }>

const loaded: { notes?: NotesIndex; note?: NotePage } = {}

const loadNotes = () =>
  import('@/features/notes/NotesIndexPage').then((m) => {
    loaded.notes = m.default
    return m
  })
const loadNote = () =>
  import('@/features/notes/NotePage').then((m) => {
    loaded.note = m.default
    return m
  })

const LazyNotes = lazy(loadNotes)
const LazyNote = lazy(loadNote)

export const routeComponent = {
  get notes(): NotesIndex {
    return loaded.notes ?? LazyNotes
  },
  get note(): NotePage {
    return loaded.note ?? LazyNote
  },
}

/** Start loading whatever code `path` needs. Resolves when it's ready (never rejects). */
export function preloadRoute(path: string): Promise<void> {
  const route = matchRoute(new URL(path, 'http://x').pathname)
  const load = route.name === 'notes' ? loadNotes : route.name === 'note' ? loadNote : null
  return load
    ? load().then(
        () => undefined,
        () => undefined,
      )
    : Promise.resolve()
}
