import { m, useTransform, type MotionValue } from 'motion/react'
import { useRef, type ElementType } from 'react'
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion'
import { useScrollProgress } from '@/hooks/useScrollProgress'

type ScrollRevealTextProps = {
  text: string
  as?: ElementType
  className?: string
  /** Opacity of words that haven't been reached yet. */
  dim?: number
}

function Word({
  progress,
  range,
  dim,
  children,
}: {
  progress: MotionValue<number>
  range: [number, number]
  dim: number
  children: string
}) {
  const opacity = useTransform(progress, range, [dim, 1])
  return (
    <>
      <m.span style={{ opacity }}>{children}</m.span>{' '}
    </>
  )
}

/**
 * Paragraph whose words light up one by one as it scrolls through the viewport, as if being
 * read. Only opacity changes, so the text is always in the DOM and readable by assistive tech.
 * Reduced motion shows it fully lit.
 */
export function ScrollRevealText({
  text,
  as: Tag = 'p',
  className,
  dim = 0.18,
}: ScrollRevealTextProps) {
  const ref = useRef<HTMLElement>(null)
  const reducedMotion = usePrefersReducedMotion()
  const scrollYProgress = useScrollProgress(ref, { start: 0.85, end: 0.55 })
  const words = text.split(/\s+/)

  return (
    <Tag ref={ref} className={className}>
      {reducedMotion
        ? text
        : words.map((word, i) => (
            <Word
              key={i}
              progress={scrollYProgress}
              range={[i / words.length, (i + 1) / words.length]}
              dim={dim}
            >
              {word}
            </Word>
          ))}
    </Tag>
  )
}
