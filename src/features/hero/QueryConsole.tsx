import { RotateCcw } from 'lucide-react'
import { useMemo, useRef } from 'react'
import { Panel } from '@/components/ui/Panel'
import { StatusDot } from '@/components/ui/StatusDot'
import { useInViewOnce } from '@/hooks/useInViewOnce'
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion'
import { cn } from '@/lib/cn'
import { buildSchedule, queryText, splitLines, type QueryLine, type TokenKind } from './kql'
import { useConsoleSequence } from './useConsoleSequence'

const tokenClass: Record<TokenKind, string> = {
  table: 'text-fg',
  pipe: 'text-fg-subtle',
  keyword: 'text-signal',
  operator: 'text-fg-muted',
  field: 'text-fg',
  string: 'text-sev-medium',
  plain: 'text-fg-muted',
}

function Caret({ blinking }: { blinking: boolean }) {
  return (
    <span
      className={cn(
        'inline-block h-[1.1em] w-[0.55em] translate-y-[0.2em] bg-signal',
        blinking && 'animate-caret',
      )}
    />
  )
}

type QueryConsoleProps = {
  query: QueryLine[]
  result: { field: string; value: string }[]
  className?: string
}

/** Animated KQL query that "returns" a one-record result. Decorative; mirrored for screen readers. */
export function QueryConsole({ query, result, className }: QueryConsoleProps) {
  const reducedMotion = usePrefersReducedMotion()
  const text = useMemo(() => queryText(query), [query])
  const schedule = useMemo(() => buildSchedule(text), [text])
  const visualRef = useRef<HTMLDivElement>(null)
  const inView = useInViewOnce(visualRef)
  const { count, phase, replay } = useConsoleSequence(schedule, {
    instant: reducedMotion,
    active: inView,
  })
  const lines = splitLines(query, count)
  const showCaretInQuery = phase === 'typing'

  return (
    <Panel
      flush
      className={cn('shadow-2xl shadow-black/40', className)}
      title="workbench / whoami.kql"
      meta={
        phase === 'results' ? (
          <button
            type="button"
            onClick={replay}
            className="inline-flex items-center gap-1.5 transition-colors hover:text-fg"
          >
            <RotateCcw aria-hidden="true" className="size-3" />
            Run again
          </button>
        ) : (
          <span className="inline-flex items-center gap-2">
            <StatusDot tone="medium" pulse />
            {phase === 'typing' ? 'Editing' : 'Running'}
          </span>
        )
      }
    >
      <div ref={visualRef} aria-hidden="true" data-phase={phase}>
        <pre className="overflow-x-auto px-4 py-4 font-mono text-[0.8125rem] leading-6 sm:px-5">
          {lines.map((line, lineIndex) => (
            <div key={lineIndex} className="flex">
              <span className="w-7 shrink-0 text-fg-subtle/60 select-none">{lineIndex + 1}</span>
              <code className="whitespace-pre">
                {line.tokens.map((token, tokenIndex) => (
                  <span key={tokenIndex}>
                    {showCaretInQuery && line.caretIndex === tokenIndex ? (
                      <>
                        <span className={tokenClass[token.kind]}>{token.typed}</span>
                        <Caret blinking={false} />
                      </>
                    ) : (
                      <span className={tokenClass[token.kind]}>{token.typed}</span>
                    )}
                    <span className="invisible">{token.rest}</span>
                  </span>
                ))}
                {showCaretInQuery && line.caretIndex === line.tokens.length ? (
                  <Caret blinking />
                ) : null}
              </code>
            </div>
          ))}
        </pre>

        <div className="border-t border-line px-4 py-4 sm:px-5">
          <div className="mb-3 flex items-center justify-between label text-fg-subtle">
            <span>{phase === 'results' ? `${result.length} fields · 1 record` : 'Results'}</span>
            <span className={cn(phase === 'results' ? 'text-signal' : 'text-fg-subtle')}>
              {phase === 'results' ? 'Completed' : phase === 'running' ? 'Running…' : 'Waiting'}
            </span>
          </div>
          <dl className="grid gap-y-2 font-mono text-[0.8125rem] leading-5">
            {result.map((row, i) => (
              <div
                key={row.field}
                className={cn(
                  'grid grid-cols-[4.5rem_1fr] gap-3',
                  phase === 'results' ? 'animate-row-in' : 'opacity-0',
                )}
                style={phase === 'results' ? { animationDelay: `${i * 90}ms` } : undefined}
              >
                <dt className="text-fg-subtle">{row.field}</dt>
                <dd className="text-fg">{row.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>

      {/* Static mirror for assistive tech: the animation above is hidden from it. */}
      <div className="sr-only">
        <p>Example query:</p>
        <pre>{text}</pre>
        <p>Result:</p>
        <dl>
          {result.map((row) => (
            <div key={row.field}>
              <dt>{row.field}</dt>
              <dd>{row.value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </Panel>
  )
}
