import { LazyMotion, MotionConfig, domAnimation } from 'motion/react'
import type { ReactNode } from 'react'

/**
 * App-wide motion setup.
 * - LazyMotion + `m.*` components keep the animation runtime small (`strict` flags any `motion.*`).
 * - `reducedMotion="user"`: with Reduce Motion on, transforms and layout animations are skipped
 *   and only opacity fades remain.
 */
export function MotionProvider({ children }: { children: ReactNode }) {
  return (
    <LazyMotion features={domAnimation} strict>
      <MotionConfig reducedMotion="user" transition={{ ease: [0.16, 1, 0.3, 1], duration: 0.8 }}>
        {children}
      </MotionConfig>
    </LazyMotion>
  )
}
