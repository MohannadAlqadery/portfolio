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
  severityColorVar,
  verdictLabel,
  type AlertTemplate,
  type Severity,
} from './alerts'
import { createScene, type Scene, type SceneColors } from './scene'

type OpenAlert = { building: number; template: AlertTemplate; caseId: string }

type Card = {
  building: number
  host: string
  role: string
  x: number
  y: number
  alert: OpenAlert | null
  /** Opened from the keyboard button: focus goes into the card and back on close. */
  fromButton: boolean
}

const STEP_MS = 650

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
    fg: v('--color-fg', '#edefea'),
    muted: v('--color-fg-muted', '#a3aaa2'),
    subtle: v('--color-fg-subtle', '#818981'),
    lineStrong: v('--color-line-strong', '#2f3531'),
    signal: v('--color-signal', '#7bd389'),
    signalStrong: v('--color-signal-strong', '#9be3a6'),
    aviation: v('--color-sev-critical', '#e5534b'),
    severity,
  }
}

const caseNumber = () =>
  `CASE-${2600 + Math.floor(Math.random() * 400)}-${Math.floor(1000 + Math.random() * 9000)}`

/**
 * The footer's night-shift city: an ASCII skyline where each building is a host. Windows flicker
 * with traffic, a scanner sweeps across, and every so often one building raises an alert. Tap it
 * (or use "Triage alert") to work the case and see how it closed.
 */
export default function NightShiftCity() {
  const wrapRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const cardRef = useRef<HTMLDialogElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const sceneRef = useRef<Scene | null>(null)
  const lastTemplate = useRef<AlertTemplate | null>(null)

  const [ready, setReady] = useState(false)
  const [hosts, setHosts] = useState(0)
  const [alert, setAlert] = useState<OpenAlert | null>(null)
  const [card, setCard] = useState<Card | null>(null)
  const [step, setStep] = useState(0)
  const [log, setLog] = useState({ triaged: 0, escalated: 0 })
  const [box, setBox] = useState({ width: 0, height: 0 })
  const titleId = useId()
  const descriptionId = useId()

  // Scene lifecycle: size to the wrapper, animate only while on screen and the tab is visible.
  useEffect(() => {
    const canvas = canvasRef.current
    const wrap = wrapRef.current
    if (!canvas || !wrap) return
    const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
    const scene = createScene(canvas, {
      colors: readColors(),
      reducedMotion,
      onReady: () => setReady(true),
    })
    sceneRef.current = scene

    let visible = false
    const sync = () => (visible && !document.hidden ? scene.start() : scene.stop())

    const resize = () => {
      const { width, height } = canvas.getBoundingClientRect()
      scene.resize(width, height)
      setHosts(scene.city().buildings.filter((b) => !b.landmark).length)
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

  // Alert schedule: the first soon after the city is built, then one at a time with a pause.
  useEffect(() => {
    if (!ready || alert) return
    const delay = log.triaged === 0 ? 900 : 3500 + Math.random() * 4000
    const timer = window.setTimeout(() => {
      const options = alertTemplates.filter((t) => t !== lastTemplate.current)
      const template = options[Math.floor(Math.random() * options.length)]
      const scene = sceneRef.current
      if (!template || !scene) return
      const building = scene.raiseAlert(template.severity)
      if (building === null) return
      lastTemplate.current = template
      setAlert({ building, template, caseId: caseNumber() })
    }, delay)
    return () => window.clearTimeout(timer)
  }, [ready, alert, log.triaged])

  const openCard = useCallback(
    (building: number, fromButton: boolean) => {
      const scene = sceneRef.current
      const b = scene?.city().buildings[building]
      if (!scene || !b) return
      const { x, y } = scene.anchor(building)
      const canvasTop = canvasRef.current?.offsetTop ?? 0
      scene.select(building)
      setStep(0)
      setCard({
        building,
        host: b.host,
        role: b.role,
        x,
        y: y + canvasTop,
        alert: alert?.building === building ? alert : null,
        fromButton,
      })
    },
    [alert],
  )

  const closeCard = useCallback(() => {
    sceneRef.current?.select(null)
    setCard((current) => {
      if (current?.fromButton) requestAnimationFrame(() => buttonRef.current?.focus())
      return null
    })
  }, [])

  // Work the case: reveal the three checks, then the verdict, and log it.
  const caseAlert = card?.alert ?? null
  useEffect(() => {
    if (!caseAlert) return
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
    const timers: number[] = []
    for (let i = 1; i <= 4; i++) {
      timers.push(window.setTimeout(() => setStep(i), reduce ? 0 : i * STEP_MS))
    }
    timers.push(
      window.setTimeout(
        () => {
          sceneRef.current?.clearAlert()
          setAlert(null)
          setLog((l) => ({
            triaged: l.triaged + 1,
            escalated: l.escalated + (caseAlert.template.verdict === 'escalated' ? 1 : 0),
          }))
        },
        reduce ? 0 : 4 * STEP_MS,
      ),
    )
    return () => timers.forEach((t) => window.clearTimeout(t))
  }, [caseAlert])

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
    if (card?.building === building) return closeCard()
    openCard(building, false)
  }

  const onCanvasMove = (event: PointerEvent<HTMLCanvasElement>) => {
    if (event.pointerType !== 'mouse') return
    const rect = event.currentTarget.getBoundingClientRect()
    const x = event.clientX - rect.left
    const scene = sceneRef.current
    scene?.pointer(x)
    // The hand cursor only over something you can click (a host), the normal arrow elsewhere.
    const overHost = scene?.pick(x, event.clientY - rect.top) != null
    event.currentTarget.style.cursor = overHost ? 'pointer' : ''
  }

  const onTriage = () => {
    if (!alert) return
    if (card?.building === alert.building) return cardRef.current?.focus()
    openCard(alert.building, true)
  }

  const cardWidth = Math.min(300, Math.max(box.width - 16, 0))
  const cardLeft = card
    ? Math.min(Math.max(card.x - cardWidth / 2, 8), Math.max(box.width - cardWidth - 8, 8))
    : 0
  const severity = card?.alert?.template.severity
  const done = step >= 4

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
            aria-disabled={!alert}
            aria-describedby={descriptionId}
            className={cn(
              'inline-flex h-7 items-center gap-2 rounded-sm border px-2.5 transition-colors',
              alert
                ? 'border-line-strong text-fg hover:border-fg-subtle'
                : 'cursor-default border-line text-fg-subtle',
            )}
          >
            {alert ? (
              <>
                <span
                  aria-hidden="true"
                  className="size-1.5 animate-pulse-dot rounded-full"
                  style={{
                    backgroundColor: `var(${severityColorVar[alert.template.severity]})`,
                    color: `var(${severityColorVar[alert.template.severity]})`,
                  }}
                />
                Triage alert
              </>
            ) : (
              'All quiet'
            )}
          </button>
        </div>
      </div>
      <p id={descriptionId} className="sr-only">
        Abu Dhabi&rsquo;s skyline at night along the Corniche, with landmarks such as Etihad Towers,
        ADNOC HQ and Aldar HQ, drawn as a network where every other building is a host. When one
        raises an alert, Triage alert opens the case and walks through how it was investigated.
      </p>

      <canvas
        ref={canvasRef}
        aria-hidden="true"
        data-testid="night-city"
        onClick={onCanvasClick}
        onPointerMove={onCanvasMove}
        onPointerLeave={() => sceneRef.current?.pointer(null)}
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
              {card.alert ? `${card.alert.caseId} · ` : ''}
              {card.host}
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

          {card.alert && severity ? (
            <>
              <p className="mt-2 label" style={{ color: `var(${severityColorVar[severity]})` }}>
                ▲ {severity} · {card.alert.template.technique} {card.alert.template.techniqueName}
              </p>
              <h3 id={titleId} className="mt-1.5 text-sm font-medium text-fg">
                {card.alert.template.title}
              </h3>
              <ol
                aria-live="polite"
                className="mt-3 space-y-1.5 font-mono text-[0.6875rem] leading-relaxed"
              >
                {card.alert.template.steps.map((text, i) =>
                  step > i ? (
                    <li key={text} className="flex animate-row-in gap-2 text-fg-muted">
                      <span aria-hidden="true" className="text-signal">
                        ›
                      </span>
                      {text}
                    </li>
                  ) : null,
                )}
                {done ? (
                  <li
                    className={cn(
                      'mt-2 animate-row-in border-t border-line pt-2',
                      card.alert.template.verdict === 'escalated' ? 'text-sev-high' : 'text-signal',
                    )}
                  >
                    {verdictLabel[card.alert.template.verdict]}: {card.alert.template.outcome}
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
                <dd className="text-signal">Healthy</dd>
                <dt className="text-fg-subtle">EDR</dt>
                <dd>Online · seen 2s ago</dd>
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
