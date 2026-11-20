import { AnimatePresence, m, useReducedMotion } from 'motion/react'
import { X } from 'lucide-react'
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from 'react'
import { DecryptText } from '@/components/motion/DecryptText'
import { cn } from '@/lib/cn'
import { getEmail } from '@/lib/email'
import { navigate } from '@/lib/router'
import { goToSection } from '@/lib/scroll'
import { toggleThemeFrom } from '@/lib/theme'
import { respond, SUGGESTIONS, WELCOME, type Line, type Reply } from './engine'

/** `pending`: the answer is still "thinking" (the dots show). */
type Entry = { id: number; input?: string; lines: Line[]; pending?: boolean }

const TONE: Record<NonNullable<Line['tone']>, string> = {
  plain: 'text-fg',
  muted: 'text-fg-subtle',
  signal: 'font-semibold text-fg',
  warn: 'text-sev-medium',
}

const EASE = [0.16, 1, 0.3, 1] as const
/** How long the terminal "thinks" before it starts writing (ms). */
const THINK = 480
/**
 * Writing speed: an answer is written out at a calm pace (at least ~65 characters a second), but
 * never takes longer than about 2.8 s, so long answers like `help` don't drag.
 */
const MIN_CPS = 65
const MAX_WRITE_MS = 2800
/** Per-character delay when a suggestion chip types itself into the input (ms). */
const KEY = 22

/** Characters in an answer, as the writer counts them. */
function charsOf(lines: readonly Line[]): number {
  return lines.reduce((n, l) => n + lengthOf(l), 0)
}

/** A decrypting line isn't typed: it counts as one step, then decrypts on its own. */
const lengthOf = (line: Line) => (line.decrypt ? 1 : line.text.length)

/**
 * The lines of an entry as they should show right now: all of them once written, or, while it is
 * being written, the lines reached so far, the last one cut at the writer's position.
 */
function visibleLines(
  entry: Entry,
  writing: { id: number; chars: number } | null,
): { line: Line; text: string; typing: boolean }[] {
  if (!writing || writing.id !== entry.id)
    return entry.lines.map((line) => ({ line, text: line.text, typing: false }))
  const out: { line: Line; text: string; typing: boolean }[] = []
  let left = Math.floor(writing.chars)
  for (const line of entry.lines) {
    if (left <= 0 && out.length > 0) break
    const len = lengthOf(line)
    const n = Math.min(len, Math.max(0, left))
    out.push({
      line,
      text: line.decrypt ? line.text : line.text.slice(0, n),
      typing: n < len,
    })
    left -= len
    if (n < len) break
  }
  // Between two lines the cursor waits at the end of the finished one, so it never blinks out
  // until the whole answer is written.
  const last = out.at(-1)
  if (last && Math.floor(writing.chars) < charsOf(entry.lines)) last.typing = true
  return out
}

/**
 * A small terminal in the corner: questions or commands in, scripted answers out (see engine.ts).
 * Both sides move like a conversation: a chip types its question into the input, the question
 * slides into the log, the terminal "thinks" for a beat, then writes the answer out character by
 * character behind a cursor while the log follows it. Screen readers get each answer whole (the
 * written-out copy is aria-hidden), sending a new question finishes the current one at once, and
 * with Reduce Motion everything appears straight away.
 */
export default function TerminalPanel({ id, onClose }: { id: string; onClose: () => void }) {
  const titleId = useId()
  const reduce = useReducedMotion() ?? false
  const inputRef = useRef<HTMLInputElement>(null)
  const logRef = useRef<HTMLDivElement>(null)
  const nextId = useRef(1)
  const timers = useRef<number[]>([])
  const [log, setLog] = useState<Entry[]>([{ id: 0, lines: WELCOME }])
  const [value, setValue] = useState('')
  const [history, setHistory] = useState<string[]>([])
  const [cursor, setCursor] = useState<number | null>(null)
  const [busy, setBusy] = useState(false)
  const [offerChips, setOfferChips] = useState(true)
  /** The entry being written out, and how many of its characters are showing. */
  const [writing, setWriting] = useState<{ id: number; chars: number; total: number } | null>(
    () => ({ id: 0, chars: 0, total: charsOf(WELCOME) }),
  )

  const later = useCallback((fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, ms))
  }, [])

  useEffect(() => {
    inputRef.current?.focus({ preventScroll: true })
    const pending = timers.current
    return () => pending.forEach((t) => window.clearTimeout(t))
  }, [])

  // Write the current answer out, frame by frame (time-based, so 60 and 144 Hz match).
  const writingId = writing?.id
  useEffect(() => {
    if (writingId === undefined) return
    let frame = 0
    let last = 0
    const tick = (now: number) => {
      const dt = last ? Math.min(now - last, 64) : 16
      last = now
      let done = false
      setWriting((w) => {
        if (!w || w.id !== writingId) return w
        const cps = Math.max(MIN_CPS, (w.total / MAX_WRITE_MS) * 1000)
        const chars = w.chars + (cps * dt) / 1000
        done = chars >= w.total
        return done ? null : { ...w, chars }
      })
      if (!done) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [writingId])

  // Keep the newest output in view while it grows, unless the reader has scrolled up to read.
  const stickRef = useRef(true)
  const grow = log.reduce((n, e) => n + e.lines.length + (e.pending ? 1 : 0), 0)
  const shown = Math.floor(writing?.chars ?? 0)
  useEffect(() => {
    const el = logRef.current
    if (!el || !stickRef.current || grow === 0) return
    // Glide to a new entry; while text is being written, keep pace with it directly.
    el.scrollTo({ top: el.scrollHeight, behavior: reduce || shown > 0 ? 'auto' : 'smooth' })
  }, [grow, shown, reduce])

  const act = (reply: Reply): Line[] => {
    switch (reply.action?.type) {
      case 'close':
        later(onClose, 500)
        break
      case 'goto': {
        const target = reply.action.id
        later(() => goToSection(target), 260)
        break
      }
      case 'navigate': {
        const path = reply.action.path
        later(() => navigate(path), 260)
        break
      }
      case 'theme':
        toggleThemeFrom({ x: window.innerWidth - 40, y: window.innerHeight - 40 })
        break
      case 'reveal-email':
        return [{ text: getEmail(), tone: 'signal', decrypt: true }]
      default:
        break
    }
    return []
  }

  const run = (input: string) => {
    const reply: Reply = respond(input)
    stickRef.current = true
    // A new question finishes whatever is still being written.
    setWriting(null)
    setHistory((h) => [...h, input])
    if (reply.action?.type === 'clear') {
      setLog([])
      setOfferChips(true)
      return
    }
    setOfferChips(Boolean(reply.fallback))
    const entryId = nextId.current++
    // The question goes in at once; the answer follows after a short "thinking" beat.
    setLog((current) => [...current, { id: entryId, input, lines: [], pending: !reduce }])
    const answer = () => {
      const lines = [...reply.lines, ...act(reply)]
      setLog((current) =>
        current.map((e) => (e.id === entryId ? { ...e, lines, pending: false } : e)),
      )
      if (!reduce) setWriting({ id: entryId, chars: 0, total: charsOf(lines) })
      setBusy(false)
    }
    if (reduce) answer()
    else {
      setBusy(true)
      later(answer, THINK)
    }
  }

  /** A chip types its question into the input, then sends it, like a person would. */
  const ask = (question: string) => {
    if (busy) return
    if (reduce) {
      run(question)
      return
    }
    setBusy(true)
    setOfferChips(false)
    for (let i = 1; i <= question.length; i++) later(() => setValue(question.slice(0, i)), i * KEY)
    later(
      () => {
        setValue('')
        run(question)
      },
      question.length * KEY + 180,
    )
  }

  const onSubmit = (event: FormEvent) => {
    event.preventDefault()
    const input = value.trim()
    if (!input || busy) return
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

  // Each line eases in as the writing reaches it.
  const lineMotion = reduce
    ? {}
    : {
        initial: { opacity: 0, y: 3 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.25, ease: EASE },
      }

  return (
    // A non-modal <dialog>: the page stays usable while the terminal is open.
    <m.dialog
      open
      id={id}
      aria-labelledby={titleId}
      initial={{ opacity: 0, y: 16, scale: 0.97, filter: 'blur(6px)' }}
      animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
      exit={{ opacity: 0, y: 10, scale: 0.98, filter: 'blur(4px)', transition: { duration: 0.2 } }}
      transition={{ duration: 0.4, ease: EASE }}
      className="fixed right-4 bottom-[calc(env(safe-area-inset-bottom)+4.25rem)] left-auto z-40 m-0 flex h-[min(30rem,70svh)] w-[min(24rem,calc(100vw-2rem))] origin-bottom-right flex-col overflow-hidden rounded-xl border border-line-strong bg-surface p-0 text-fg shadow-2xl shadow-black/40"
    >
      <div className="flex items-center justify-between border-b border-line px-4 py-3">
        <p id={titleId} className="font-mono text-xs text-fg-muted">
          <span className="text-fg">mohannad@soc</span>:~${' '}
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
        aria-busy={busy}
        data-lenis-prevent
        onScroll={(e) => {
          const el = e.currentTarget
          stickRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 24
        }}
        className="flex-1 space-y-3 overflow-y-auto overscroll-contain px-4 py-4 font-mono text-[0.78rem] leading-relaxed"
      >
        {log.map((entry) => (
          <div key={entry.id}>
            {entry.input !== undefined ? (
              <m.p
                className="mb-1 text-fg"
                {...(reduce
                  ? {}
                  : {
                      initial: { opacity: 0, x: -6 },
                      animate: { opacity: 1, x: 0 },
                      transition: { duration: 0.28, ease: EASE },
                    })}
              >
                <span aria-hidden="true" className="mr-2 text-fg-subtle">
                  ›
                </span>
                {entry.input}
              </m.p>
            ) : null}
            {entry.pending ? (
              <m.p
                aria-hidden="true"
                data-thinking
                className="flex h-5 items-center gap-1 text-fg-subtle"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2 }}
              >
                {[0, 1, 2].map((d) => (
                  <span
                    key={d}
                    className="size-1 animate-typing rounded-full bg-current"
                    style={{ animationDelay: `${d * 140}ms` }}
                  />
                ))}
              </m.p>
            ) : null}
            {visibleLines(entry, reduce ? null : writing).map(({ line, text, typing }, i) => (
              <m.p
                key={i}
                {...lineMotion}
                className={cn(
                  'break-words whitespace-pre-wrap',
                  TONE[line.tone ?? 'plain'],
                  line.indent && 'mb-1 pl-[2ch]',
                )}
              >
                <span className="sr-only">{line.text}</span>
                <span aria-hidden="true">
                  {line.decrypt && !typing ? (
                    <DecryptText
                      text={line.text}
                      duration={900}
                      delay={120}
                      glyphs="abcdefghijklmnopqrstuvwxyz0123456789#$%&*+=?"
                    />
                  ) : (
                    text
                  )}
                  {typing ? (
                    <span
                      data-caret
                      className="ml-px inline-block h-[1.05em] w-[0.55ch] translate-y-[0.2em] animate-caret bg-fg-muted"
                    />
                  ) : null}
                </span>
              </m.p>
            ))}
          </div>
        ))}
      </div>

      <AnimatePresence initial={false}>
        {offerChips ? (
          <m.div
            key="chips"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: EASE }}
            className="overflow-hidden border-t border-line"
          >
            <div className="flex flex-wrap gap-1.5 px-4 py-3">
              {SUGGESTIONS.map((question) => (
                <button
                  key={question}
                  type="button"
                  disabled={busy}
                  onClick={() => ask(question)}
                  className="rounded-sm border border-line-strong px-2 py-1 text-xs text-fg-muted transition-colors hover:border-fg-subtle hover:text-fg disabled:opacity-50"
                >
                  {question}
                </button>
              ))}
            </div>
          </m.div>
        ) : null}
      </AnimatePresence>

      <form onSubmit={onSubmit} className="flex items-center gap-2 border-t border-line px-4 py-3">
        <span aria-hidden="true" className="font-mono text-sm text-fg-subtle">
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
          className="min-w-0 flex-1 bg-transparent font-mono text-sm text-fg caret-fg placeholder:text-fg-subtle focus:outline-none"
        />
      </form>
    </m.dialog>
  )
}
