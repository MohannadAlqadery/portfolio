import { clsx, type ClassValue } from 'clsx'
import { extendTailwindMerge } from 'tailwind-merge'

/**
 * Teach tailwind-merge about our custom tokens so that e.g. `text-display` (a font size)
 * is not treated as a text colour and dropped when combined with `text-fg`.
 */
const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      text: ['display', 'headline', 'label'],
      color: [
        'canvas',
        'surface',
        'raised',
        'line',
        'line-strong',
        'fg',
        'fg-muted',
        'fg-subtle',
        'signal',
        'signal-strong',
        'signal-wash',
        'sev-critical',
        'sev-high',
        'sev-medium',
        'sev-low',
        'sev-info',
      ],
      font: ['sans', 'mono', 'display'],
    },
  },
})

/** Compose class names conditionally and resolve Tailwind conflicts (last one wins). */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}
