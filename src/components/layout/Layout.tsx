import type { ReactNode } from 'react'
import { CommandPaletteProvider } from '@/features/command-palette/CommandPaletteProvider'
import { SiteFooter } from './SiteFooter'
import { SiteHeader } from './SiteHeader'
import { SkipLink } from './SkipLink'

/** Shared page chrome. Used by the client app and by the pre-renderer. */
export function Layout({ children }: { children: ReactNode }) {
  return (
    <CommandPaletteProvider>
      <SkipLink targetId="main" />
      <div id="top" />
      <SiteHeader />
      <main id="main" tabIndex={-1} className="outline-none">
        {children}
      </main>
      <SiteFooter />
    </CommandPaletteProvider>
  )
}
