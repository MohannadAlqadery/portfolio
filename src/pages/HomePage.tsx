import { Hero } from '@/features/hero/Hero'
import { CaseFilesSection } from '@/features/sections/CaseFilesSection'
import { ContactSection } from '@/features/sections/ContactSection'
import { CredentialsSection } from '@/features/sections/CredentialsSection'
import { EducationSection } from '@/features/sections/EducationSection'
import { ProfileSection } from '@/features/sections/ProfileSection'
import { ToolkitSection } from '@/features/sections/ToolkitSection'

export function HomePage() {
  return (
    <>
      <Hero />
      <ProfileSection />
      <CaseFilesSection />
      <CredentialsSection />
      <ToolkitSection />
      <EducationSection />
      <ContactSection />
    </>
  )
}
