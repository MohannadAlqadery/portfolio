export type Credential = {
  code: string
  name: string
  issuer: string
  year: number
  /** Shown as a large card when true. */
  featured: boolean
  /** Public verification page on the issuer's site. Only real URLs supplied by the owner. */
  verifyUrl?: string
  /** Credential / certification ID as printed on the issuer's verification page. */
  credentialId?: string
  /** `YYYY-MM-DD` dates from the issuer's verification page. */
  issued?: string
  expires?: string
  /** Official badge, self-hosted under /public/badges (the CSP blocks third-party images). */
  badge?: { src: string; alt: string }
}

export const credentials: Credential[] = [
  {
    code: 'SC-200',
    name: 'Microsoft Certified: Security Operations Analyst Associate',
    issuer: 'Microsoft',
    year: 2026,
    featured: true,
    verifyUrl: 'https://learn.microsoft.com/en-us/users/mohannad03/credentials/fe82a5bf34b093d8',
    credentialId: 'FE82A5BF34B093D8',
    issued: '2026-09-13',
    expires: '2027-09-13',
    badge: { src: '/badges/sc-200.svg', alt: 'Microsoft Certified Associate badge' },
  },
  {
    code: 'eJPTv2',
    name: 'Junior Penetration Tester',
    issuer: 'INE Security',
    year: 2026,
    featured: true,
    verifyUrl: 'https://certs.ine.com/512bc5c7-0e4e-49d3-b8ea-f0613a12e641',
    credentialId: '186203393',
    issued: '2026-06-24',
    expires: '2029-06-24',
    badge: { src: '/badges/ejpt.png', alt: 'INE eJPT badge' },
  },
  {
    code: 'eSOC',
    name: 'Security Operations Certified, Level 1',
    issuer: 'INE Security',
    year: 2026,
    featured: true,
    verifyUrl: 'https://certs.ine.com/c9957237-51ee-4a71-8797-c3f9a1d08963',
    credentialId: '187784264',
    issued: '2026-07-10',
    expires: '2029-07-10',
    badge: { src: '/badges/esoc.png', alt: 'INE eSOC badge' },
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
    name: 'Network Support and Security',
    issuer: 'Cisco',
    year: 2024,
    featured: false,
  },
]
