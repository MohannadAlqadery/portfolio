import { site } from '@/content/site'

/** Assemble the contact address at runtime (see `site.emailParts`). */
export function getEmail(parts: { user: string; domain: string } = site.emailParts): string {
  return `${parts.user}@${parts.domain}`
}

/**
 * A `mailto:` link that opens the visitor's own mail app with a draft filled in. Nothing is sent
 * from the site. Line breaks use CRLF, as RFC 6068 asks for in `body`.
 */
export function buildMailto(
  to: string,
  draft: { name?: string; topic: string; message: string },
): string {
  const name = draft.name?.trim()
  const subject = name ? `${draft.topic} · from ${name}` : draft.topic
  const body = [draft.message.trim(), '', name ? `– ${name}` : ''].join('\n').trim()
  const encode = (value: string) => encodeURIComponent(value.replace(/\r?\n/g, '\r\n'))
  return `mailto:${to}?subject=${encode(subject)}&body=${encode(body)}`
}

/** Hand a `mailto:` link to the visitor's mail app (a link click, like any mail link on a page). */
export function openMailto(url: string): void {
  const link = document.createElement('a')
  link.href = url
  link.click()
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
