import { useCallback, useEffect, useState } from 'react'
import { charsAt } from './kql'

export type ConsolePhase = 'typing' | 'running' | 'results'

type Options = {
  /** Skip straight to the final state (reduced motion). */
  instant: boolean
  /** Hold the sequence until this becomes true (e.g. the console scrolls into view). */
  active?: boolean
  /** Pause before the first keystroke, ms. */
  startDelay?: number
  /** "Running query" pause between typing and results, ms. */
  runDuration?: number
}

/**
 * Drives the console: types characters on the given schedule, pauses as if running, then shows
 * results. Uses requestAnimationFrame, so it naturally pauses in background tabs.
 */
export function useConsoleSequence(
  schedule: readonly number[],
  { instant, active = true, startDelay = 700, runDuration = 750 }: Options,
) {
  const total = schedule.length
  const [runId, setRunId] = useState(0)
  const [count, setCount] = useState(0)
  const [phase, setPhase] = useState<ConsolePhase>('typing')

  useEffect(() => {
    if (instant || !active) return

    let frame = 0
    let timeout = 0
    let last = -1
    // First run waits for the page to settle; replays start almost immediately.
    const startAt = performance.now() + (runId === 0 ? startDelay : 200)

    const tick = (now: number) => {
      const typed = charsAt(schedule, now - startAt)
      if (typed !== last) {
        last = typed
        setCount(typed)
      }
      if (typed < total) {
        frame = requestAnimationFrame(tick)
      } else {
        setPhase('running')
        timeout = window.setTimeout(() => setPhase('results'), runDuration)
      }
    }

    frame = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(frame)
      window.clearTimeout(timeout)
    }
  }, [runId, instant, active, schedule, total, startDelay, runDuration])

  const replay = useCallback(() => {
    setCount(0)
    setPhase('typing')
    setRunId((id) => id + 1)
  }, [])

  if (instant) return { count: total, phase: 'results' as ConsolePhase, replay }
  return { count, phase, replay }
}
