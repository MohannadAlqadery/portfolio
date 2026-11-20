import { lazy, Suspense, useEffect, type ComponentType, type LazyExoticComponent } from 'react'
import { Layout } from '@/components/layout/Layout'
import { MotionProvider } from '@/components/motion/MotionProvider'
import { CommandPaletteProvider } from '@/features/command-palette/CommandPaletteProvider'
import { useHash } from '@/hooks/useHash'
import { matchRoute, usePathname } from '@/lib/router'
import { startSmoothScroll } from '@/lib/smooth-scroll'
import { HomePage } from '@/pages/HomePage'
import NotFoundPage from '@/pages/NotFoundPage'

// Internal views (hash routes on the homepage), loaded on demand.
const internalViews: Record<string, LazyExoticComponent<() => React.JSX.Element>> = {
  '#styleguide': lazy(() => import('@/features/styleguide/Styleguide')),
  '#og': lazy(() => import('@/features/og/OgCard')),
}

export type RoutePages = {
  NotesIndexPage: ComponentType
  NotePage: ComponentType<{ slug: string }>
  NotFoundPage: ComponentType
}

// In the browser, notes and 404 load as separate chunks so the homepage bundle doesn't grow.
// The pre-renderer passes the same components eagerly, inside the same Suspense boundary, so the
// server HTML and the client tree match and can be hydrated without a flash.
const lazyPages: RoutePages = {
  NotesIndexPage: lazy(() => import('@/features/notes/NotesIndexPage')),
  NotePage: lazy(() => import('@/features/notes/NotePage')),
  // Tiny, and also used by NotePage for unknown slugs, so it stays in the main bundle.
  NotFoundPage,
}

function RouteView({ pathname, pages }: { pathname: string; pages: RoutePages }) {
  const route = matchRoute(pathname)
  switch (route.name) {
    case 'home':
      return <HomePage />
    case 'notes':
      return <pages.NotesIndexPage />
    case 'note':
      return <pages.NotePage slug={route.slug} />
    case 'not-found':
      return <pages.NotFoundPage />
  }
}

export default function App({ pages = lazyPages }: { pages?: RoutePages }) {
  const hash = useHash()
  const pathname = usePathname()
  const InternalView = pathname === '/' ? internalViews[hash] : undefined

  // Inertial page scrolling (browser only; skipped for reduced motion).
  useEffect(() => startSmoothScroll(), [])

  if (InternalView) {
    return (
      <MotionProvider>
        <CommandPaletteProvider>
          <Suspense fallback={null}>
            <InternalView />
          </Suspense>
        </CommandPaletteProvider>
      </MotionProvider>
    )
  }

  return (
    <MotionProvider>
      <Layout>
        <Suspense fallback={<div className="min-h-[70svh]" />}>
          <RouteView pathname={pathname} pages={pages} />
        </Suspense>
      </Layout>
    </MotionProvider>
  )
}
