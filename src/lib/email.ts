import { site } from '@/content/site'

/** Assemble the contact address at runtime (see `site.emailParts`). */
export function getEmail(parts: { user: string; domain: string } = site.emailParts): string {
  return `${parts.user}@${parts.domain}`
}

/** Copy text to the clipboard. Resolves to `false` when the browser refuses. */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    return false
  }
}
