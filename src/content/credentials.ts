export type Credential = {
  code: string
  name: string
  issuer: string
  year: number
  /** Shown as a large card when true. */
  featured: boolean
  /**
   * Public verification link (Credly, Microsoft Learn transcript, INE…).
   * Left undefined until the owner supplies a real URL; the card then hides the link.
   */
  verifyUrl?: string
}

export const credentials: Credential[] = [
  {
    code: 'SC-200',
    name: 'Microsoft Certified: Security Operations Analyst Associate',
    issuer: 'Microsoft',
    year: 2026,
    featured: true,
  },
  {
    code: 'eJPTv2',
    name: 'eLearnSecurity Junior Penetration Tester',
    issuer: 'INE Security',
    year: 2026,
    featured: true,
  },
  {
    code: 'eSOC',
    name: 'Security Operations Certified, Level 1',
    issuer: 'INE Security',
    year: 2026,
    featured: true,
  },
  {
    code: 'AWS',
    name: 'Cloud Security Foundations',
    issuer: 'AWS Academy',
    year: 2025,
    featured: false,
  },
  {
    code: 'Cisco',
    name: 'Network Support and Security · Networking Basics',
    issuer: 'Cisco',
    year: 2024,
    featured: false,
  },
]
