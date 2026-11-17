/**
 * Site-wide identity and contact details.
 * Only details the owner agreed to publish live here (no phone number).
 */
export const site = {
  name: 'Mohannad Alqadery',
  monogram: 'MA',
  role: 'SOC Analyst',
  location: {
    city: 'Abu Dhabi',
    country: 'UAE',
    timeZone: 'Asia/Dubai',
    timeZoneLabel: 'GST',
    coordinates: 'N 24.45° · E 54.37°',
  },
  links: {
    linkedin: 'https://www.linkedin.com/in/mohannad-alqadery',
    source: 'https://github.com/MohannadAlqadery/portfolio',
  },
  /**
   * Stored in parts and assembled at runtime so the address is not sitting in the HTML for
   * naive scrapers.
   */
  emailParts: { user: 'mohannadalqadery', domain: 'gmail.com' },
} as const
