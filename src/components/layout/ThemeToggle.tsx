import { Moon, Sun } from 'lucide-react'
import type { MouseEvent } from 'react'
import { useTheme } from '@/hooks/useTheme'
import { cn } from '@/lib/cn'
import { toggleThemeFrom } from '@/lib/theme'

const iconClass =
  'absolute inset-0 size-4 transition-[opacity,rotate,scale] duration-500 ease-[var(--ease-out-expo)] motion-reduce:transition-none'

/** Sun/moon switch. The new theme spreads out from the button as a growing circle. */
export function ThemeToggle({ className }: { className?: string }) {
  const { theme } = useTheme()
  const next = theme === 'dark' ? 'light' : 'dark'

  const onClick = (event: MouseEvent<HTMLButtonElement>) => {
    const rect = event.currentTarget.getBoundingClientRect()
    toggleThemeFrom({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 })
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Switch to ${next} theme`}
      title={`Switch to ${next} theme`}
      className={cn(
        'grid size-8 place-items-center rounded-md text-fg-muted transition-colors hover:bg-raised hover:text-fg',
        className,
      )}
    >
      <span aria-hidden="true" className="relative size-4">
        <Sun
          className={cn(
            iconClass,
            theme === 'dark' ? 'opacity-100' : 'scale-50 -rotate-90 opacity-0',
          )}
        />
        <Moon
          className={cn(
            iconClass,
            theme === 'light' ? 'opacity-100' : 'scale-50 rotate-90 opacity-0',
          )}
        />
      </span>
    </button>
  )
}
