import { lazy, Suspense } from 'react'
import { useHash } from '@/hooks/useHash'

// Internal design reference, loaded on demand so it never weighs on the main bundle.
const Styleguide = lazy(() => import('@/features/styleguide/Styleguide'))

export default function App() {
  const hash = useHash()

  if (hash === '#styleguide') {
    return (
      <Suspense fallback={null}>
        <Styleguide />
      </Suspense>
    )
  }

  return (
    <main className="grid min-h-dvh place-items-center px-4 font-mono text-sm">
      <p>
        <span aria-hidden="true" className="text-signal">
          ●{' '}
        </span>
        Mohannad Alqadery — site under construction
      </p>
    </main>
  )
}
