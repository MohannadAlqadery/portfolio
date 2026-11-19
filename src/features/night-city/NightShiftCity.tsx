import { X } from 'lucide-react'
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type MouseEvent,
  type PointerEvent,
} from 'react'
import { cn } from '@/lib/cn'
import {
  alertTemplates,
  byUrgency,
  incidentTemplates,
  severityColorVar,
  verdictLabel,
  type AlertTemplate,
  type Severity,
  type Verdict,
} from './alerts'
import type { City } from './city'
import { createScene, type Scene, type SceneColors } from './scene'

/** An alert (one host) or incident (linked hosts) waiting for triage. */
type OpenCase = {
  group: number
  template: AlertTemplate
  members: number[]
  hosts: string[]
  caseId: string
  openedAt: number
}

type Card = { x: number; y: number; fromButton: boolean } & (
  { kind: 'case'; item: OpenCase } | { kind: 'host'; building: number; host: string; role: string }
)

const MAX_OPEN = 3
const STEP_MS = 650

const verdictTone: Record<Verdict, string> = {
  escalated: 'text-sev-high',
  contained: 'text-signal',
  benign: 'text-signal',
  'false-positive': 'text-fg-muted',
}

function readColors(): SceneColors {
  const style = getComputedStyle(document.documentElement)
  const v = (name: string, fallback: string) => style.getPropertyValue(name).trim() || fallback
  const severity = Object.fromEntries(
    (Object.keys(severityColorVar) as Severity[]).map((s) => [
      s,
      v(severityColorVar[s], '#e8b14a'),
    ]),
  ) as Record<Severity, string>
  return {
    canvas: v('--color-canvas', '#0b0d0c'),
    fg: v('--color-fg', '#edefea'),
    muted: v('--color-fg-muted', '#a3aaa2'),
    subtle: v('--color-fg-subtle', '#818981'),
    lineStrong: v('--color-line-strong', '#2f3531'),
    signal: v('--color-signal', '#7bd389'),
    signalStrong: v('--color-signal-strong', '#9be3a6'),
    signalWash: v('--color-signal-wash', '#15241a'),
    aviation: v('--color-sev-critical', '#e5534b'),
    severity,
  }
}

const reduceMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false

const caseNumber = (incident: boolean) =>
  `${incident ? 'INC' : 'CASE'}-${2600 + Math.floor(Math.random() * 400)}-${Math.floor(1000 + Math.random() * 9000)}`

/** Stable small number from a host name, so each host starts at its own point. */
const hashOf = (text: string) => [...text].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7)

/** EDR heartbeat: "seen Ns ago", counting up live and resetting whenever the agent checks in. */
function LastSeen({ host }: { host: string }) {
  const [beat, setBeat] = useState(() => ({
    seconds: 1 + (hashOf(host) % 9),
    every: 6 + (hashOf(host) % 11),
  }))
  useEffect(() => {
    const timer = window.setInterval(() => {
      setBeat((b) =>
        b.seconds + 1 >= b.every
          ? { seconds: 0, every: 4 + Math.floor(Math.random() * 14) }
          : { ...b, seconds: b.seconds + 1 },
      )
    }, 1000)
    return () => window.clearInterval(timer)
  }, [])
  return (
    <span className="tabular-nums">{beat.seconds === 0 ? 'just now' : `${beat.seconds}s ago`}</span>
  )
}

/**
 * The footer's night-shift city: an Abu Dhabi-style skyline along the Corniche where every
 * building is a host. Windows flicker with traffic, a scanner sweeps across, and alerts and
 * multi-host incidents come in during the shift. Tap a lit building (or use "Triage alert") to
 * work the case and see how it closed.
 */
export default function NightShiftCity() {
  const wrapRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const cardRef = useRef<HTMLDialogElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const sceneRef = useRef<Scene | null>(null)
  const spawned = useRef(0)

  const [ready, setReady] = useState(false)
  const [hosts, setHosts] = useState(0)
  const [cases, setCases] = useState<OpenCase[]>([])
  const [card, setCard] = useState<Card | null>(null)
  const [step, setStep] = useState(0)
  const [log, setLog] = useState({ triaged: 0, escalated: 0 })
  const [isolated, setIsolated] = useState<ReadonlySet<string>>(new Set())
  const [box, setBox] = useState({ width: 0, height: 0 })
  const titleId = useId()
  const descriptionId = useId()

  // Scene lifecycle: size to the wrapper, animate only while on screen and the tab is visible.
  useEffect(() => {
    const canvas = canvasRef.current
    const wrap = wrapRef.current
    if (!canvas || !wrap) return
    const scene = createScene(canvas, {
      colors: readColors(),
      reducedMotion: reduceMotion(),
      onReady: () => setReady(true),
    })
    sceneRef.current = scene

    let visible = false
    let lastCity: City | null = null
    const sync = () => (visible && !document.hidden ? scene.start() : scene.stop())
    const resize = () => {
      const { width, height } = canvas.getBoundingClientRect()
      scene.resize(width, height)
      const city = scene.city()
      // A new layout means new hosts: drop cases that pointed at the old ones.
      if (lastCity && city !== lastCity) {
        setCases([])
        setCard(null)
      }
      lastCity = city
      setHosts(city.buildings.length)
      setBox({ width: wrap.clientWidth, height: wrap.clientHeight })
    }
    const observer = new ResizeObserver(resize)
    const onScreen = new IntersectionObserver(([entry]) => {
      visible = entry?.isIntersecting ?? false
      sync()
    })
    // Measure with the real font so the grid lines up.
    void (document.fonts?.load('12px "Geist Mono Variable"') ?? Promise.resolve()).finally(() => {
      resize()
      observer.observe(canvas)
      onScreen.observe(canvas)
    })
    document.addEventListener('visibilitychange', sync)

    return () => {
      observer.disconnect()
      onScreen.disconnect()
      document.removeEventListener('visibilitychange', sync)
      scene.destroy()
      sceneRef.current = null
    }
  }, [])

  // The shift: alerts and incidents keep coming, up to three open at once.
  useEffect(() => {
    if (!ready || cases.length >= MAX_OPEN) return
    const delay = spawned.current === 0 ? 900 : 2200 + Math.random() * 3800
    const timer = window.setTimeout(() => {
      const scene = sceneRef.current
      if (!scene) return
      const incident = spawned.current > 0 && Math.random() < 0.3
      const open = new Set(cases.map((c) => c.template.title))
      const pool = (incident ? incidentTemplates : alertTemplates).filter((t) => !open.has(t.title))
      const template = pool[Math.floor(Math.random() * pool.length)]
      if (!template) return
      const { group, members } = scene.raise(template.severity, template.hosts ?? 1)
      if (!members.length) return
      spawned.current += 1
      const names = members.map((i) => scene.city().buildings[i]?.host ?? '')
      setCases((list) => [
        ...list,
        {
          group,
          template,
          members,
          hosts: names,
          caseId: caseNumber(members.length > 1),
          openedAt: Date.now(),
        },
      ])
    }, delay)
    return () => window.clearTimeout(timer)
  }, [ready, cases])

  const anchorFor = useCallback((building: number) => {
    const scene = sceneRef.current
    const { x, y } = scene?.anchor(building) ?? { x: 0, y: 0 }
    return { x, y: y + (canvasRef.current?.offsetTop ?? 0) }
  }, [])

  const openCase = useCallback(
    (item: OpenCase, fromButton: boolean) => {
      const first = item.members[0] ?? 0
      sceneRef.current?.select(first)
      setStep(0)
      setCard({ kind: 'case', item, fromButton, ...anchorFor(first) })
    },
    [anchorFor],
  )

  const openHost = useCallback(
    (building: number) => {
      const b = sceneRef.current?.city().buildings[building]
      if (!b) return
      sceneRef.current?.select(building)
      setCard({
        kind: 'host',
        building,
        host: b.host,
        role: b.role,
        fromButton: false,
        ...anchorFor(building),
      })
    },
    [anchorFor],
  )

  const closeCard = useCallback(() => {
    sceneRef.current?.select(null)
    setCard((current) => {
      if (current?.fromButton) requestAnimationFrame(() => buttonRef.current?.focus())
      return null
    })
  }, [])

  // Work the case: reveal the three checks, then the verdict, and close it out.
  const working = card?.kind === 'case' ? card.item : null
  useEffect(() => {
    if (!working) return
    const reduce = reduceMotion()
    const timers: number[] = []
    for (let i = 1; i <= 4; i++) {
      timers.push(window.setTimeout(() => setStep(i), reduce ? 0 : i * STEP_MS))
    }
    timers.push(
      window.setTimeout(
        () => {
          sceneRef.current?.clear(working.group)
          setCases((list) => list.filter((c) => c.group !== working.group))
          const escalated = working.template.verdict === 'escalated'
          setLog((l) => ({ triaged: l.triaged + 1, escalated: l.escalated + (escalated ? 1 : 0) }))
          if (escalated) setIsolated((set) => new Set([...set, ...working.hosts]))
        },
        reduce ? 0 : 4 * STEP_MS,
      ),
    )
    return () => timers.forEach((t) => window.clearTimeout(t))
  }, [working])

  // Focus the card when opened from the keyboard; close on Escape or a tap elsewhere.
  useEffect(() => {
    if (!card) return
    if (card.fromButton) cardRef.current?.focus()
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeCard()
    }
    const onPointer = (event: globalThis.PointerEvent) => {
      const target = event.target as Node
      if (cardRef.current?.contains(target) || canvasRef.current?.contains(target)) return
      if (buttonRef.current?.contains(target)) return
      closeCard()
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('pointerdown', onPointer)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('pointerdown', onPointer)
    }
  }, [card, closeCard])

  const onCanvasClick = (event: MouseEvent<HTMLCanvasElement>) => {
    const rect = event.currentTarget.getBoundingClientRect()
    const building = sceneRef.current?.pick(event.clientX - rect.left, event.clientY - rect.top)
    if (building === null || building === undefined) return closeCard()
    const item = cases.find((c) => c.members.includes(building))
    if (item) {
      if (card?.kind === 'case' && card.item.group === item.group) return closeCard()
      return openCase(item, false)
    }
    if (card?.kind === 'host' && card.building === building) return closeCard()
    openHost(building)
  }

  const onCanvasMove = (event: PointerEvent<HTMLCanvasElement>) => {
    if (event.pointerType !== 'mouse') return
    const rect = event.currentTarget.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top
    const scene = sceneRef.current
    scene?.pointer(x, y)
    // The hand cursor only over something you can open (a host), the normal arrow elsewhere.
    event.currentTarget.style.cursor = scene?.pick(x, y) != null ? 'pointer' : ''
  }

  const onTriage = () => {
    const next = [...cases].sort(byUrgency)[0]
    if (!next) return
    if (card?.kind === 'case' && card.item.group === next.group) return cardRef.current?.focus()
    openCase(next, true)
  }

  const cardWidth = Math.min(310, Math.max(box.width - 16, 0))
  const cardLeft = card
    ? Math.min(Math.max(card.x - cardWidth / 2, 8), Math.max(box.width - cardWidth - 8, 8))
    : 0
  const urgent = [...cases].sort(byUrgency)[0]

  return (
    <div ref={wrapRef} className="relative flex h-full flex-col">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 label text-fg-subtle">
        <p className="flex items-center gap-2">
          <span
            aria-hidden="true"
            className="size-1.5 animate-pulse-dot rounded-full bg-signal text-signal"
          />
          Night shift · Abu Dhabi · {hosts} hosts
        </p>
        <div className="flex items-center gap-3">
          <p>
            Triaged <span className="text-fg-muted">{log.triaged}</span> · Escalated{' '}
            <span className="text-fg-muted">{log.escalated}</span>
          </p>
          <button
            ref={buttonRef}
            type="button"
            onClick={onTriage}
            aria-disabled={!urgent}
            aria-describedby={descriptionId}
            className={cn(
              'inline-flex h-7 items-center gap-2 rounded-sm border px-2.5 transition-colors',
              urgent
                ? 'border-line-strong text-fg hover:border-fg-subtle'
                : 'cursor-default border-line text-fg-subtle',
            )}
          >
            {urgent ? (
              <>
                <span
                  aria-hidden="true"
                  className="size-1.5 animate-pulse-dot rounded-full"
                  style={{
                    backgroundColor: `var(${severityColorVar[urgent.template.severity]})`,
                    color: `var(${severityColorVar[urgent.template.severity]})`,
                  }}
                />
                Triage alert
                <span className="rounded-sm bg-raised px-1 text-fg-muted tabular-nums">
                  {cases.length}
                </span>
              </>
            ) : (
              'All quiet'
            )}
          </button>
        </div>
      </div>
      <p id={descriptionId} className="sr-only">
        An Abu Dhabi-style skyline at night along the Corniche, drawn as a network where every
        building is a host. Alerts and multi-host incidents come in during the shift; Triage alert
        opens the most urgent one and walks through how it was investigated.
      </p>

      <canvas
        ref={canvasRef}
        aria-hidden="true"
        data-testid="night-city"
        onClick={onCanvasClick}
        onPointerMove={onCanvasMove}
        onPointerLeave={(event) => {
          sceneRef.current?.pointer(null)
          event.currentTarget.style.cursor = ''
        }}
        className="mt-4 min-h-0 w-full flex-1 touch-manipulation"
      />

      {card ? (
        // Non-modal native dialog: the page stays usable; Escape and outside taps close it.
        <dialog
          ref={cardRef}
          open
          aria-labelledby={titleId}
          tabIndex={-1}
          style={{ left: cardLeft, bottom: box.height - card.y + 8, width: cardWidth }}
          className="absolute right-auto z-10 m-0 max-w-none animate-row-in rounded-md border border-line-strong bg-raised p-4 text-fg shadow-[0_12px_40px_-12px_rgb(0_0_0/0.8)] outline-none"
        >
          <div className="flex items-start justify-between gap-3">
            <p className="label text-fg-subtle">
              {card.kind === 'case'
                ? `${card.item.caseId} · ${
                    card.item.hosts.length > 1
                      ? `${card.item.hosts.length} hosts`
                      : (card.item.hosts[0] ?? '')
                  }`
                : card.host}
            </p>
            <button
              type="button"
              onClick={closeCard}
              className="-m-1 grid size-6 shrink-0 place-items-center rounded-sm text-fg-subtle transition-colors hover:text-fg"
            >
              <X aria-hidden="true" className="size-3.5" />
              <span className="sr-only">Close</span>
            </button>
          </div>

          {card.kind === 'case' ? (
            <>
              <p
                className="mt-2 label"
                style={{ color: `var(${severityColorVar[card.item.template.severity]})` }}
              >
                {card.item.hosts.length > 1 ? '◆ Incident' : '▲'} · {card.item.template.severity} ·{' '}
                {card.item.template.technique} {card.item.template.techniqueName}
              </p>
              <h3 id={titleId} className="mt-1.5 text-sm font-medium text-fg">
                {card.item.template.title}
              </h3>
              {card.item.hosts.length > 1 ? (
                <ul aria-label="Affected hosts" className="mt-2 flex flex-wrap gap-1.5">
                  {card.item.hosts.map((name) => (
                    <li
                      key={name}
                      className="rounded-sm border border-line px-1.5 py-0.5 font-mono text-[0.625rem] text-fg-muted"
                    >
                      {name}
                    </li>
                  ))}
                </ul>
              ) : null}
              <ol
                aria-live="polite"
                className="mt-3 space-y-1.5 font-mono text-[0.6875rem] leading-relaxed"
              >
                {card.item.template.steps.map((text, i) =>
                  step > i ? (
                    <li key={text} className="flex animate-row-in gap-2 text-fg-muted">
                      <span aria-hidden="true" className="text-signal">
                        ›
                      </span>
                      {text}
                    </li>
                  ) : null,
                )}
                {step >= 4 ? (
                  <li
                    className={cn(
                      'mt-2 animate-row-in border-t border-line pt-2',
                      verdictTone[card.item.template.verdict],
                    )}
                  >
                    {verdictLabel[card.item.template.verdict]}: {card.item.template.outcome}
                  </li>
                ) : (
                  <li aria-hidden="true" className="text-fg-subtle">
                    <span className="animate-caret">▍</span>
                  </li>
                )}
              </ol>
            </>
          ) : (
            <>
              <h3 id={titleId} className="mt-2 text-sm font-medium text-fg">
                {card.role}
              </h3>
              <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 font-mono text-[0.6875rem] text-fg-muted">
                <dt className="text-fg-subtle">Status</dt>
                {isolated.has(card.host) ? (
                  <dd className="text-sev-high">Contained</dd>
                ) : (
                  <dd className="text-signal">Healthy</dd>
                )}
                <dt className="text-fg-subtle">EDR</dt>
                <dd>
                  {isolated.has(card.host) ? 'Isolated' : 'Online'} · seen{' '}
                  <LastSeen key={card.host} host={card.host} />
                </dd>
                <dt className="text-fg-subtle">Alerts</dt>
                <dd>None open</dd>
              </dl>
            </>
          )}
        </dialog>
      ) : null}
    </div>
  )
}
