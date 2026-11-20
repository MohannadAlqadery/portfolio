import { useEffect } from 'react'
import { Hero } from '@/features/hero/Hero'
import { SITE_TITLE } from '@/features/notes/meta'
import { CaseFilesSection } from '@/features/sections/CaseFilesSection'
import { ContactSection } from '@/features/sections/ContactSection'
import { CredentialsSection } from '@/features/sections/CredentialsSection'
import { ProfileSection } from '@/features/sections/ProfileSection'
import { TimelineSection } from '@/features/sections/TimelineSection'
import { ToolkitSection } from '@/features/sections/ToolkitSection'
import { useDocumentMeta } from '@/hooks/useDocumentMeta'
import { scrollToId } from '@/lib/scroll'

export function HomePage() {
  useDocumentMeta(SITE_TITLE)

  // Arriving from another page with a section hash (e.g. /notes → /#cases): scroll once rendered.
  useEffect(() => {
    const id = window.location.hash.slice(1)
    if (id && document.getElementById(id)) {
      const frame = requestAnimationFrame(() => scrollToId(id))
      return () => cancelAnimationFrame(frame)
    }
  }, [])

  return (
    <>
      <Hero />
      <ProfileSection />
      <CaseFilesSection />
      <CredentialsSection />
      <ToolkitSection />
      <TimelineSection />
      <ContactSection />
    </>
  )
}
