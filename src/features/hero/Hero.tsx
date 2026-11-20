import { ArrowDown } from 'lucide-react'
import {
  m,
  useMotionValue,
  useMotionValueEvent,
  useScroll,
  useTransform,
  type MotionValue,
} from 'motion/react'
import { useLayoutEffect, useRef, useState, type RefObject } from 'react'
import { DecryptText } from '@/components/motion/DecryptText'
import { ButtonLink } from '@/components/ui/Button'
import { heroScene } from '@/content/hero'
import { site } from '@/content/site'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion'
import { cn } from '@/lib/cn'
import { getSmoothScroll } from '@/lib/smooth-scroll'
import { scrollToId } from '@/lib/scroll'
import { AsciiMonogram } from './AsciiMonogram'

/*
 * The hero is a pinned scroll scene. A 4:5 ASCII monogram card sits under a huge
 * "[ SECURITY ANALYST ]" headline; as you scroll, the headline lifts away and the card tilts in
 * 3D while it travels into the intro layout ("Hi, I'm Mohannad."), which fades in around it.
 *
 * The card is rendered once. Two invisible anchors mark where it sits in the hero and in the
 * intro; the card is measured against both and interpolated between them, so the layout stays
 * plain CSS at every breakpoint. Reduced motion and very short screens get a static version.
 */

/** Scroll progress at which each part of the scene happens (0 = top, 1 = scene end). */
const T = {
  headlineOut: [0.03, 0.28],
  travel: [0.05, 0.56],
  introIn: [0.4, 0.62],
} as const

type Box = { x: number; y: number; w: number; h: number }

const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2)
const lerp = (a: number, b: number, t: number) => a + (b - a) * t

function boxOf(el: HTMLElement | null, frame: HTMLElement): Box | null {
  if (!el) return null
  const r = el.getBoundingClientRect()
  const f = frame.getBoundingClientRect()
  return { x: r.left - f.left, y: r.top - f.top, w: r.width, h: r.height }
}

/* -------------------------------------------------------------------------------------------- */
/* Pieces shared by the animated and static versions                                           */
/* -------------------------------------------------------------------------------------------- */

const anchorHero = 'aspect-[4/5] w-[clamp(8rem,17vw,13rem)]'
const anchorIntro = 'aspect-[4/5] w-[clamp(8.5rem,24vw,17rem)]'

function Headline() {
  const [first, second] = heroScene.headline
  return (
    <h1
      id="hero-title"
      className="text-center font-display text-[clamp(3.75rem,15vw,13rem)] leading-[0.84] font-extrabold tracking-[-0.02em] uppercase font-stretch-[72%]"
    >
      <span className="sr-only">{site.name}, </span>
      <span className="flex items-center justify-center gap-[0.12em]">
        <Bracket>[</Bracket>
        <DecryptText text={first ?? ''} duration={1300} />
      </span>
      <span className="flex items-center justify-center gap-[0.12em] md:pl-[0.5em]">
        <DecryptText text={second ?? ''} duration={1300} delay={250} />
        <Bracket>]</Bracket>
      </span>
    </h1>
  )
}

function Bracket({ children }: { children: string }) {
  return (
    <span
      aria-hidden="true"
      className="-mt-[0.08em] text-[0.55em] font-light text-fg-subtle font-stretch-100%"
    >
      {children}
    </span>
  )
}

function HeroLabels() {
  return (
    <>
      <p className="font-display text-2xl font-semibold tracking-tight md:text-3xl">
        ©{__BUILD_DATE__.slice(0, 4)}
      </p>
      <p className="flex items-center label text-fg-muted">
        <DecryptText text={heroScene.tagline} duration={1100} delay={600} />
        <span aria-hidden="true" className="ml-1 h-3 w-px animate-caret bg-fg-muted" />
      </p>
    </>
  )
}

function IntroLead() {
  const { greeting, role, current } = heroScene
  return (
    <div className="max-md:text-center">
      <h2 className="font-display text-[clamp(2.25rem,5vw,4.5rem)] leading-[0.92] font-bold tracking-[-0.03em]">
        {greeting[0]}
        <br />
        {greeting[1]}
      </h2>
      <p className="mt-4 font-display text-lg leading-tight font-semibold text-fg-muted md:text-xl">
        {role[0]}
        <br />
        {role[1]}
      </p>
      <div className="mt-6 hidden border-t border-line pt-4 md:block">
        <p className="label text-fg-subtle">{current.label}</p>
        <p className="mt-2 text-sm font-medium text-fg">{current.org}</p>
        <p className="text-sm text-fg-muted">{current.title}</p>
        <p className="text-sm text-fg-subtle">
          {site.location.city}, {site.location.country}
        </p>
      </div>
    </div>
  )
}

function IntroStatement() {
  return (
    <div className="max-md:text-center">
      <p className="mx-auto max-w-xs text-lg leading-snug text-pretty text-fg-muted md:mx-0 md:text-xl">
        {heroScene.statement.map((part, i) =>
          'strong' in part ? (
            <strong key={i} className="font-semibold text-fg">
              {part.text}
            </strong>
          ) : (
            <span key={i}>{part.text}</span>
          ),
        )}
      </p>
      <ButtonLink
        href="#cases"
        variant="solid"
        size="sm"
        className="mt-6"
        onClick={(e) => {
          e.preventDefault()
          scrollToId('cases')
        }}
      >
        {heroScene.cta}
        <ArrowDown aria-hidden="true" className="size-3.5" />
      </ButtonLink>
    </div>
  )
}

const introGrid =
  'grid items-center gap-8 md:grid-cols-[1fr_auto_1fr] md:gap-12 lg:gap-16 [&>*:first-child]:md:justify-self-start [&>*:last-child]:md:justify-self-end'

/** Faint dot grid that fades toward the edges. */
function Backdrop() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 -z-10 bg-dotgrid [mask-image:radial-gradient(ellipse_60%_55%_at_50%_45%,black,transparent_75%)] opacity-50"
    />
  )
}

/* -------------------------------------------------------------------------------------------- */
/* Static version: reduced motion, or screens too short for a pinned scene                      */
/* -------------------------------------------------------------------------------------------- */

function StaticHero() {
  return (
    <section
      aria-labelledby="hero-title"
      className="relative isolate -mt-[calc(4.25rem+env(safe-area-inset-top))]"
    >
      <Backdrop />
      <div className="relative flex min-h-svh flex-col items-center justify-center pt-16">
        <Headline />
        <div className="absolute inset-x-0 bottom-0 container-page flex items-end justify-between gap-6 pb-6">
          <HeroLabels />
        </div>
      </div>
      <div className={cn('container-page py-20', introGrid)}>
        <IntroLead />
        <AsciiMonogram className={cn(anchorIntro, 'mx-auto')} />
        <IntroStatement />
      </div>
    </section>
  )
}

/* -------------------------------------------------------------------------------------------- */
/* Animated version                                                                             */
/* -------------------------------------------------------------------------------------------- */

/** Measures both anchors (relative to the pinned frame) on mount, resize and font load. */
function useAnchors(
  frameRef: RefObject<HTMLDivElement | null>,
  heroRef: RefObject<HTMLDivElement | null>,
  introRef: RefObject<HTMLDivElement | null>,
) {
  const boxes = useRef<{ hero: Box; intro: Box } | null>(null)
  const version = useMotionValue(0)
  const [size, setSize] = useState<{ w: number; h: number } | null>(null)

  useLayoutEffect(() => {
    const frame = frameRef.current
    if (!frame) return
    const update = () => {
      const hero = boxOf(heroRef.current, frame)
      const intro = boxOf(introRef.current, frame)
      if (!hero || !intro || intro.w === 0) return
      boxes.current = { hero, intro }
      setSize((prev) =>
        prev?.w === intro.w && prev.h === intro.h ? prev : { w: intro.w, h: intro.h },
      )
      version.set(version.get() + 1)
    }
    update()
    const observer = new ResizeObserver(update)
    observer.observe(frame)
    void document.fonts?.ready.then(update)
    return () => observer.disconnect()
  }, [frameRef, heroRef, introRef, version])

  return { boxes, version, size }
}

function useCardMotion(
  progress: MotionValue<number>,
  boxes: RefObject<{ hero: Box; intro: Box } | null>,
  version: MotionValue<number>,
) {
  const travel = useTransform(progress, [...T.travel], [0, 1], { clamp: true })
  const at =
    (pick: (hero: Box, intro: Box, t: number) => number) =>
    // Re-runs when scroll moves (travel) or the layout is re-measured (version).
    () => {
      version.get()
      const b = boxes.current
      return b ? pick(b.hero, b.intro, easeInOutCubic(travel.get())) : 0
    }

  // The card is laid out at the intro size; in the hero it's scaled down about its centre.
  const x = useTransform(at((h, i, t) => lerp(h.x + h.w / 2 - i.w / 2, i.x, t)))
  const y = useTransform(at((h, i, t) => lerp(h.y + h.h / 2 - i.h / 2, i.y, t)))
  const scale = useTransform(at((h, i, t) => lerp(h.w / i.w, 1, t)))
  const [start, end] = T.travel
  const mid = (start + end) / 2
  const rotateY = useTransform(progress, [start, mid, end], [0, -32, 0])
  const rotateX = useTransform(progress, [start, mid, end], [0, 12, 0])
  const rotateZ = useTransform(progress, [start, mid, end], [0, -3, 0])
  return { x, y, scale, rotateX, rotateY, rotateZ }
}

function AnimatedHero() {
  const sceneRef = useRef<HTMLElement>(null)
  const frameRef = useRef<HTMLDivElement>(null)
  const heroAnchorRef = useRef<HTMLDivElement>(null)
  const introAnchorRef = useRef<HTMLDivElement>(null)

  const { scrollYProgress: progress } = useScroll({
    target: sceneRef,
    offset: ['start start', 'end end'],
  })
  const { boxes, version, size } = useAnchors(frameRef, heroAnchorRef, introAnchorRef)
  const card = useCardMotion(progress, boxes, version)

  const headlineOpacity = useTransform(progress, [...T.headlineOut], [1, 0])
  const headlineY = useTransform(progress, [...T.headlineOut], [0, -140])
  const headlineBlur = useTransform(progress, [...T.headlineOut], ['blur(0px)', 'blur(12px)'])
  const labelsOpacity = useTransform(progress, [0.02, 0.18], [1, 0])

  const [inStart, inEnd] = T.introIn
  const introOpacity = useTransform(progress, [inStart, inEnd], [0, 1])
  const introY = useTransform(progress, [inStart, inEnd], [48, 0])
  const statementOpacity = useTransform(progress, [inStart + 0.04, inEnd + 0.04], [0, 1])
  const statementY = useTransform(progress, [inStart + 0.04, inEnd + 0.04], [48, 0])

  // Hidden copy stays in the accessibility tree but can't be clicked until it has faded in.
  const [introLive, setIntroLive] = useState(false)
  useMotionValueEvent(introOpacity, 'change', (o) => setIntroLive(o > 0.6))
  const headlineLive = useTransform(headlineOpacity, (o) => (o < 0.05 ? 'none' : 'auto'))

  // Tabbing into the intro before it has appeared scrolls the scene to where it's shown.
  const revealIntro = () => {
    if (introLive || !sceneRef.current) return
    const scene = sceneRef.current
    const top = scene.getBoundingClientRect().top + window.scrollY
    const target = top + (scene.offsetHeight - window.innerHeight) * (inEnd + 0.06)
    const lenis = getSmoothScroll()
    if (lenis) lenis.scrollTo(target)
    else window.scrollTo({ top: target })
  }

  return (
    <section
      ref={sceneRef}
      aria-labelledby="hero-title"
      className="relative -mt-[calc(4.25rem+env(safe-area-inset-top))] h-[250svh]"
    >
      <div
        ref={frameRef}
        className="sticky top-0 isolate h-svh overflow-hidden [perspective:1400px]"
      >
        <Backdrop />

        {/* Hero: headline and corner labels. */}
        <m.div
          style={{
            opacity: headlineOpacity,
            y: headlineY,
            filter: headlineBlur,
            pointerEvents: headlineLive,
          }}
          className="absolute inset-0 flex flex-col items-center justify-center pb-[24svh] md:pb-[20svh]"
        >
          <Headline />
        </m.div>
        <m.div
          style={{ opacity: labelsOpacity }}
          className="absolute inset-x-0 container-page flex items-end justify-between gap-6 max-md:top-[calc(env(safe-area-inset-top)+5rem)] md:bottom-0 md:pb-6"
        >
          <HeroLabels />
        </m.div>
        <div
          ref={heroAnchorRef}
          aria-hidden="true"
          className={cn('invisible absolute bottom-0 left-1/2 -translate-x-1/2', anchorHero)}
        />

        {/* Intro: text columns around the card's landing spot. */}
        <div
          onFocus={revealIntro}
          className={cn(
            'absolute inset-0 container-page content-center pt-16',
            introGrid,
            !introLive && 'pointer-events-none',
          )}
        >
          <m.div style={{ opacity: introOpacity, y: introY }}>
            <IntroLead />
          </m.div>
          <div ref={introAnchorRef} aria-hidden="true" className={cn('mx-auto', anchorIntro)} />
          <m.div style={{ opacity: statementOpacity, y: statementY }}>
            <IntroStatement />
          </m.div>
        </div>

        {/* The travelling card, laid out at the intro size and moved into place. */}
        {size ? (
          <m.div
            className="absolute top-0 left-0 will-change-transform [transform-style:preserve-3d]"
            style={{ width: size.w, height: size.h, ...card }}
          >
            <AsciiMonogram className="size-full" />
          </m.div>
        ) : null}
      </div>
    </section>
  )
}

export function Hero() {
  const reducedMotion = usePrefersReducedMotion()
  // A pinned scene needs room for the intro layout; short screens get the static version.
  const tooShort = useMediaQuery('(max-height: 34rem)')
  return reducedMotion || tooShort ? <StaticHero /> : <AnimatedHero />
}
