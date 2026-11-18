import { useEffect } from 'react'

/**
 * Keeps the tab title and meta description in step with client-side navigation.
 * Pre-rendered pages already ship the right values; this covers in-app navigation.
 */
export function useDocumentMeta(title: string, description?: string): void {
  useEffect(() => {
    document.title = title
    if (description) {
      document.querySelector('meta[name="description"]')?.setAttribute('content', description)
    }
  }, [title, description])
}
