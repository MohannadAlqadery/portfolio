import { m, type Variants } from 'motion/react'
import type { ElementType } from 'react'
import { cn } from '@/lib/cn'

type BlurTextProps = {
  text: string
  as?: ElementType
  className?: string
  /** Animate word by word (headlines) or letter by letter (short display words). */
  by?: 'word' | 'letter'
  delay?: number
  /** Gap between consecutive pieces, in seconds. */
  stagger?: number
  /** Start on mount, or the first time the text scrolls into view. */
  trigger?: 'mount' | 'inView'
}

const piece: Variants = {
  hidden: { opacity: 0, y: '0.35em', filter: 'blur(10px)' },
  shown: { opacity: 1, y: 0, filter: 'blur(0px)' },
}

/**
 * Headline that assembles piece by piece: each word (or letter) rises out of a blur, staggered.
 * The full string stays readable to assistive tech via a visually hidden copy.
 */
export function BlurText({
  text,
  as: Tag = 'span',
  className,
  by = 'word',
  delay = 0,
  stagger,
  trigger = 'inView',
}: BlurTextProps) {
  const pieces = by === 'word' ? text.split(/(\s+)/) : Array.from(text)
  const gap = stagger ?? (by === 'word' ? 0.08 : 0.035)
  const play = trigger === 'mount' ? { animate: 'shown' } : { whileInView: 'shown' }

  return (
    <Tag className={className}>
      <span className="sr-only">{text}</span>
      <m.span
        aria-hidden="true"
        className="inline"
        initial="hidden"
        {...play}
        viewport={{ once: true, amount: 0.5 }}
        transition={{ delayChildren: delay, staggerChildren: gap }}
      >
        {pieces.map((p, i) =>
          /^\s+$/.test(p) ? (
            <span key={i}>{p}</span>
          ) : (
            <m.span
              key={i}
              variants={piece}
              transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
              className={cn('inline-block will-change-[transform,filter,opacity]')}
            >
              {p === ' ' ? ' ' : p}
            </m.span>
          ),
        )}
      </m.span>
    </Tag>
  )
}
