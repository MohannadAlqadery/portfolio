import { cn } from '@/lib/cn'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost'
export type ButtonSize = 'sm' | 'md'

const base =
  'inline-flex items-center justify-center gap-2 rounded-sm font-mono text-[0.8125rem] tracking-tight transition-colors duration-200 disabled:pointer-events-none disabled:opacity-50'

const variants: Record<ButtonVariant, string> = {
  primary: 'bg-signal text-canvas hover:bg-signal-strong',
  secondary: 'border border-line-strong text-fg hover:border-fg-subtle hover:bg-raised',
  ghost: 'text-fg-muted hover:bg-raised hover:text-fg',
}

const sizes: Record<ButtonSize, string> = {
  sm: 'h-8 px-3',
  md: 'h-10 px-4',
}

export function buttonClasses({
  variant = 'secondary',
  size = 'md',
  className,
}: {
  variant?: ButtonVariant | undefined
  size?: ButtonSize | undefined
  className?: string | undefined
} = {}) {
  return cn(base, variants[variant], sizes[size], className)
}
