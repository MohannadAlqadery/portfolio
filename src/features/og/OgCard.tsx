import { heroScene } from '@/content/hero'
import { site } from '@/content/site'
import { buildCity, SHOP_H, type Tower } from '@/features/city-watch/scene'

/** Band height the skyline is laid out in (px); the city scales with it, as in the footer. */
const BAND = 320
const WIDTH = 1200
const SKY_H = 330
/** Street level inside the skyline SVG. */
const STREET = SKY_H - 26

const city = buildCity(WIDTH / BAND)

const LAYER_FILL = [
  'color-mix(in srgb, var(--color-fg) 8%, var(--color-canvas))',
  'color-mix(in srgb, var(--color-fg) 5%, var(--color-canvas))',
  'color-mix(in srgb, var(--color-fg) 2.5%, var(--color-canvas))',
] as const

/** A tower's outline with its crown (setbacks, spire, slanted roof or mast), as in the footer. */
function silhouette(t: Tower) {
  const x = t.x * BAND
  const w = t.w * BAND + 0.5
  const top = STREET - t.h * BAND
  const u = BAND
  const body = `M${x} ${STREET}V${top}H${x + w}V${STREET}Z`
  switch (t.crown) {
    case 'step':
      return `${body}M${x + w * 0.18} ${top}v${-u * 0.05}h${w * 0.64}v${u * 0.05}ZM${x + w * 0.34} ${top - u * 0.05}v${-u * 0.03}h${w * 0.32}v${u * 0.03}Z`
    case 'spire':
      return `${body}M${x + w * 0.42} ${top}L${x + w * 0.5} ${top - u * 0.12}L${x + w * 0.58} ${top}Z`
    case 'slant':
      return `${body}M${x} ${top}L${x + w} ${top - u * 0.06}V${top}Z`
    case 'mast':
      return `${body}M${x + w * 0.5 - 1} ${top}v${-u * 0.1}h2v${u * 0.1}Z`
    default:
      return `${body}M${x + w * 0.15} ${top}v${-u * 0.018}h${w * 0.18}v${u * 0.018}ZM${x + w * 0.6} ${top}v${-u * 0.028}h${w * 0.12}v${u * 0.028}Z`
  }
}

/** Lit windows of a tower as small rects, the same grid the footer uses. */
function windows(t: Tower) {
  const x = t.x * BAND
  const w = t.w * BAND
  const top = STREET - t.h * BAND
  const bottom = STREET - (t.layer === 2 ? SHOP_H * BAND : 0)
  const cw = w / t.cols
  const ch = (bottom - top - BAND * 0.02) / t.rows
  return t.lit.map((i) => ({
    i,
    x: x + (i % t.cols) * cw + cw * 0.28,
    y: top + BAND * 0.02 + Math.floor(i / t.cols) * ch + ch * 0.28,
    w: Math.max(1, cw * 0.44),
    h: Math.max(1, ch * 0.42),
  }))
}

/**
 * 1200×630 social preview card, rendered at /#og and captured to public/og.png by `npm run og`.
 * Deliberately quiet: the name, one line about the work, and the footer's night city along the
 * bottom (a couple of windows lit in amber, as unpatched hosts). Same fonts and tokens as the site.
 */
export default function OgCard() {
  const firstName = site.name.split(' ')[0] ?? site.name
  const [lead, rest] = heroScene.role

  return (
    <div id="og-card" className="relative h-[630px] w-[1200px] overflow-hidden bg-canvas">
      <div className="absolute inset-x-16 top-14 z-10 flex items-baseline justify-between">
        <p className="font-display text-[34px] font-bold tracking-tight text-fg">
          {firstName}
          <span className="text-fg-subtle">.</span>
        </p>
        <p className="label text-[15px] text-fg-subtle">
          {site.location.city} · {site.location.country}
        </p>
      </div>

      <p className="absolute top-[140px] left-16 z-10 font-display text-[92px] leading-[0.95] font-bold tracking-[-0.035em] text-fg">
        {lead}
        <br />
        <span className="text-fg-subtle">{rest}</span>
      </p>

      <svg
        aria-hidden="true"
        viewBox={`0 0 ${WIDTH} ${SKY_H}`}
        className="absolute inset-x-0 bottom-0 h-[330px] w-[1200px]"
      >
        <defs>
          <linearGradient id="og-haze" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="var(--color-canvas)" stopOpacity="1" />
            <stop offset="0.45" stopColor="var(--color-canvas)" stopOpacity="0" />
          </linearGradient>
        </defs>
        {([0, 1, 2] as const).map((layer) => (
          <g key={layer} style={{ fill: LAYER_FILL[layer] }}>
            {city.towers
              .filter((t) => t.layer === layer)
              .map((t) => (
                <path key={`${t.x}`} d={silhouette(t)} />
              ))}
          </g>
        ))}
        {/* Lit windows; a few in amber, as hosts still waiting for a patch. */}
        {city.towers
          .filter((t) => t.layer > 0 && t.x * BAND < WIDTH)
          .flatMap((t, k) =>
            windows(t).map((r) => {
              const unpatched = (r.i * 7 + k * 13) % 97 === 0
              return (
                <rect
                  key={`${k}-${r.i}`}
                  x={r.x}
                  y={r.y}
                  width={r.w}
                  height={r.h}
                  style={{
                    fill: unpatched ? 'var(--color-sev-medium)' : 'var(--color-fg)',
                    opacity: unpatched ? 0.95 : 0.18 + ((r.i * 37) % 10) / 30,
                  }}
                />
              )
            }),
          )}
        <rect x="0" y="0" width={WIDTH} height={SKY_H} fill="url(#og-haze)" />
        <rect
          x="0"
          y={STREET}
          width={WIDTH}
          height="1"
          style={{ fill: 'var(--color-line-strong)' }}
        />
      </svg>
    </div>
  )
}
