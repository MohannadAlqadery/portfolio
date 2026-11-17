import { lazy, Suspense, type LazyExoticComponent } from 'react'
import { SiteFooter } from '@/components/layout/SiteFooter'
import { SiteHeader } from '@/components/layout/SiteHeader'
import { SkipLink } from '@/components/layout/SkipLink'
import { CommandPaletteProvider } from '@/features/command-palette/CommandPaletteProvider'
import { useHash } from '@/hooks/useHash'
import { HomePage } from '@/pages/HomePage'

// Internal views, loaded on demand so they never weigh on the main bundle.
const internalViews: Record<string, LazyExoticComponent<() => React.JSX.Element>> = {
  '#styleguide': lazy(() => import('@/features/styleguide/Styleguide')),
  '#og': lazy(() => import('@/features/og/OgCard')),
}

export default function App() {
  const hash = useHash()
  const InternalView = internalViews[hash]

  return (
    <CommandPaletteProvider>
      {InternalView ? (
        <Suspense fallback={null}>
          <InternalView />
        </Suspense>
      ) : (
        <>
          <SkipLink targetId="main" />
          <div id="top" />
          <SiteHeader />
          <main id="main" tabIndex={-1} className="outline-none">
            <HomePage />
          </main>
          <SiteFooter />
        </>
      )}
    </CommandPaletteProvider>
  )
}
