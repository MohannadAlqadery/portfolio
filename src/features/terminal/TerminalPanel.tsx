import { m } from 'motion/react'
import { X } from 'lucide-react'
import { useEffect, useId, useRef, useState, type FormEvent, type KeyboardEvent } from 'react'
import { cn } from '@/lib/cn'
import { getEmail } from '@/lib/email'
import { navigate } from '@/lib/router'
import { goToSection } from '@/lib/scroll'
import { toggleThemeFrom } from '@/lib/theme'
import { respond, SUGGESTIONS, type Line, type Reply } from './engine'

type Entry = { id: number; input?: string; lines: Line[] }

const TONE: Record<NonNullable<Line['tone']>, string> = {
  plain: 'text-fg',
  muted: 'text-fg-subtle',
  signal: 'text-signal',
  warn: 'text-sev-medium',
}

const WELCOME: Line[] = [
  { text: 'Scripted terminal. Ask about my work, or type `help`.' },
  {
    text: 'No AI here: answers come from this site, and nothing leaves your browser.',
    tone: 'muted',
  },
]

/**
 * A small terminal in the corner: questions or commands in, scripted answers out (see engine.ts).
 * Commands can jump to sections, open the notes, switch theme or reveal the email address.
 */
export default function TerminalPanel({ id, onClose }: { id: string; onClose: () => void }) {
  const titleId = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const logRef = useRef<HTMLDivElement>(null)
  const nextId = useRef(1)
  const [log, setLog] = useState<Entry[]>([{ id: 0, lines: WELCOME }])
  const [value, setValue] = useState('')
  const [history, setHistory] = useState<string[]>([])
  const [cursor, setCursor] = useState<number | null>(null)

  useEffect(() => {
    inputRef.current?.focus({ preventScroll: true })
  }, [])

  // Keep the newest output in view whenever an entry is added.
  const entries = log.length
  useEffect(() => {
    const el = logRef.current
    if (el && entries > 0) el.scrollTop = el.scrollHeight
  }, [entries])

  const run = (input: string) => {
    const reply: Reply = respond(input)
    const extra: Line[] = []
    switch (reply.action?.type) {
      case 'clear':
        setLog([])
        setHistory((h) => [...h, input])
        return
      case 'close':
        window.setTimeout(onClose, 250)
        break
      case 'goto': {
        const target = reply.action.id
        window.setTimeout(() => goToSection(target), 150)
        break
      }
      case 'navigate': {
        const path = reply.action.path
        window.setTimeout(() => navigate(path), 150)
        break
      }
      case 'theme':
        toggleThemeFrom({ x: window.innerWidth - 40, y: window.innerHeight - 40 })
        break
      case 'reveal-email':
        extra.push({ text: getEmail(), tone: 'signal' })
        break
      default:
        break
    }
    setLog((current) => [
      ...current,
      { id: nextId.current++, input, lines: [...reply.lines, ...extra] },
    ])
    setHistory((h) => [...h, input])
  }

  const onSubmit = (event: FormEvent) => {
    event.preventDefault()
    const input = value.trim()
    if (!input) return
    setValue('')
    setCursor(null)
    run(input)
  }

  // Up / Down walk through earlier commands; Escape closes.
  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault()
      onClose()
    } else if (event.key === 'ArrowUp' && history.length > 0) {
      event.preventDefault()
      const next = cursor === null ? history.length - 1 : Math.max(0, cursor - 1)
      setCursor(next)
      setValue(history[next] ?? '')
    } else if (event.key === 'ArrowDown' && cursor !== null) {
      event.preventDefault()
      const next = cursor + 1
      setCursor(next >= history.length ? null : next)
      setValue(next >= history.length ? '' : (history[next] ?? ''))
    }
  }

  return (
    // A non-modal <dialog>: the page stays usable while the terminal is open.
    <m.dialog
      open
      id={id}
      aria-labelledby={titleId}
      initial={{ opacity: 0, y: 16, scale: 0.97, filter: 'blur(6px)' }}
      animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
      exit={{ opacity: 0, y: 10, scale: 0.98, filter: 'blur(4px)', transition: { duration: 0.16 } }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="fixed right-4 bottom-[calc(env(safe-area-inset-bottom)+4.25rem)] left-auto z-40 m-0 flex h-[min(30rem,70svh)] w-[min(24rem,calc(100vw-2rem))] origin-bottom-right flex-col overflow-hidden rounded-xl border border-line-strong bg-surface p-0 text-fg shadow-2xl shadow-black/40"
    >
      <div className="flex items-center justify-between border-b border-line px-4 py-3">
        <p id={titleId} className="font-mono text-xs text-fg-muted">
          <span className="text-signal">mohannad@soc</span>:~${' '}
          <span className="text-fg-subtle">ask</span>
        </p>
        <button
          type="button"
          onClick={onClose}
          className="grid size-7 place-items-center rounded-md text-fg-subtle transition-colors hover:bg-raised hover:text-fg"
        >
          <X aria-hidden="true" className="size-4" />
          <span className="sr-only">Close terminal</span>
        </button>
      </div>

      <div
        ref={logRef}
        role="log"
        aria-live="polite"
        data-lenis-prevent
        className="flex-1 space-y-3 overflow-y-auto overscroll-contain px-4 py-4 font-mono text-[0.78rem] leading-relaxed"
      >
        {log.map((entry) => (
          <div key={entry.id}>
            {entry.input !== undefined ? (
              <p className="text-fg">
                <span aria-hidden="true" className="mr-2 text-signal">
                  ›
                </span>
                {entry.input}
              </p>
            ) : null}
            {entry.lines.map((line, i) => (
              <p
                key={i}
                className={cn(
                  'break-words whitespace-pre-wrap',
                  TONE[line.tone ?? 'plain'],
                  line.indent && 'mb-1 pl-[2ch]',
                )}
              >
                {line.text}
              </p>
            ))}
          </div>
        ))}
      </div>

      {history.length === 0 ? (
        <div className="flex flex-wrap gap-1.5 border-t border-line px-4 py-3">
          {SUGGESTIONS.map((question) => (
            <button
              key={question}
              type="button"
              onClick={() => run(question)}
              className="rounded-sm border border-line-strong px-2 py-1 text-xs text-fg-muted transition-colors hover:border-fg-subtle hover:text-fg"
            >
              {question}
            </button>
          ))}
        </div>
      ) : null}

      <form onSubmit={onSubmit} className="flex items-center gap-2 border-t border-line px-4 py-3">
        <span aria-hidden="true" className="font-mono text-sm text-signal">
          ›
        </span>
        <label htmlFor={`${id}-input`} className="sr-only">
          Ask a question or type a command
        </label>
        <input
          ref={inputRef}
          id={`${id}-input`}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={onKeyDown}
          autoComplete="off"
          autoCapitalize="off"
          spellCheck={false}
          placeholder="Ask about my work, or type help"
          className="min-w-0 flex-1 bg-transparent font-mono text-sm text-fg placeholder:text-fg-subtle focus:outline-none"
        />
      </form>
    </m.dialog>
  )
}
