import { lazy, Suspense } from 'react'
import { SiteFooter } from '@/components/layout/SiteFooter'
import { SiteHeader } from '@/components/layout/SiteHeader'
import { SkipLink } from '@/components/layout/SkipLink'
import { CommandPaletteProvider } from '@/features/command-palette/CommandPaletteProvider'
import { useHash } from '@/hooks/useHash'
import { HomePage } from '@/pages/HomePage'

// Internal design reference, loaded on demand so it never weighs on the main bundle.
const Styleguide = lazy(() => import('@/features/styleguide/Styleguide'))

export default function App() {
  const hash = useHash()

  return (
    <CommandPaletteProvider>
      {hash === '#styleguide' ? (
        <Suspense fallback={null}>
          <Styleguide />
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
