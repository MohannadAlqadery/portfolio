import { useMemo } from 'react'
import { buildSkyline, SKY_H, SKY_W, type Building } from './city'

const INK = '#1a1a1a'
const PAPER = '#fbfbf9'
const ground = SKY_H

function Windows({ b, top }: { b: Building; top: number }) {
  if (!b.cols) return null
  const padX = 10
  const padY = 16
  const cellW = (b.w - padX * 2) / b.cols
  const cellH = Math.min(30, (b.h - padY * 2) / b.rows)
  const items = []
  for (let r = 0; r < b.rows; r++) {
    for (let c = 0; c < b.cols; c++) {
      // A deterministic sprinkle of dark windows: someone's home, someone's at work.
      const dark = (r * 7 + c * 13 + b.x) % 11 === 0
      items.push(
        <rect
          key={`${r}-${c}`}
          x={b.x + padX + c * cellW + cellW * 0.22}
          y={top + padY + r * cellH}
          width={cellW * 0.56}
          height={cellH * 0.5}
          fill={dark ? INK : PAPER}
          stroke={INK}
          strokeWidth={1.4}
        />,
      )
    }
  }
  return <g>{items}</g>
}

function BuildingShape({ b }: { b: Building }) {
  const top = ground - b.h
  const body = (
    <rect x={b.x} y={top} width={b.w} height={b.h} fill={PAPER} stroke={INK} strokeWidth={2.2} />
  )
  const shade = b.hatch ? (
    <rect x={b.x + b.w * 0.62} y={top} width={b.w * 0.38} height={b.h} fill="url(#ink-hatch)" />
  ) : null

  switch (b.kind) {
    case 'tower':
      return (
        <g>
          {body}
          {shade}
          <Windows b={b} top={top} />
          <rect
            x={b.x + b.w * 0.2}
            y={top - 22}
            width={b.w * 0.6}
            height={22}
            fill={PAPER}
            stroke={INK}
            strokeWidth={2.2}
          />
          {b.mast ? (
            <line
              x1={b.x + b.w / 2}
              y1={top - 22}
              x2={b.x + b.w / 2}
              y2={top - 22 - b.mast}
              stroke={INK}
              strokeWidth={2}
            />
          ) : null}
        </g>
      )
    case 'stepped': {
      const mid = { x: b.x + b.w * 0.15, w: b.w * 0.7, h: 34 }
      const crown = { x: b.x + b.w * 0.32, w: b.w * 0.36, h: 26 }
      return (
        <g>
          {body}
          {shade}
          <Windows b={b} top={top} />
          <rect
            x={mid.x}
            y={top - mid.h}
            width={mid.w}
            height={mid.h}
            fill={PAPER}
            stroke={INK}
            strokeWidth={2.2}
          />
          <rect
            x={crown.x}
            y={top - mid.h - crown.h}
            width={crown.w}
            height={crown.h}
            fill={PAPER}
            stroke={INK}
            strokeWidth={2.2}
          />
        </g>
      )
    }
    case 'tank': {
      // A rooftop water tank on little legs.
      const tx = b.x + b.w * 0.55
      const tw = Math.min(34, b.w * 0.32)
      return (
        <g>
          {body}
          {shade}
          <Windows b={b} top={top} />
          <line x1={tx + 4} y1={top} x2={tx + 4} y2={top - 14} stroke={INK} strokeWidth={2} />
          <line
            x1={tx + tw - 4}
            y1={top}
            x2={tx + tw - 4}
            y2={top - 14}
            stroke={INK}
            strokeWidth={2}
          />
          <path
            d={`M ${tx} ${top - 14} v -26 q ${tw / 2} -12 ${tw} 0 v 26 z`}
            fill={PAPER}
            stroke={INK}
            strokeWidth={2.2}
          />
        </g>
      )
    }
    case 'dome': {
      // A dome on a low hall, with a minaret beside it.
      const hallH = 70
      const hallTop = ground - hallH
      const cx = b.x + b.w * 0.42
      const r = b.w * 0.3
      const mx = b.x + b.w - 22
      return (
        <g>
          <rect
            x={b.x}
            y={hallTop}
            width={b.w * 0.84}
            height={hallH}
            fill={PAPER}
            stroke={INK}
            strokeWidth={2.2}
          />
          {[0.12, 0.3, 0.48, 0.66].map((f) => (
            <path
              key={f}
              d={`M ${b.x + b.w * f} ${ground} v -34 q 8 -14 16 0 v 34`}
              fill="none"
              stroke={INK}
              strokeWidth={1.6}
            />
          ))}
          <path
            d={`M ${cx - r} ${hallTop} a ${r} ${r * 1.05} 0 0 1 ${r * 2} 0 z`}
            fill={PAPER}
            stroke={INK}
            strokeWidth={2.2}
          />
          <line
            x1={cx}
            y1={hallTop - r * 1.05}
            x2={cx}
            y2={hallTop - r * 1.05 - 18}
            stroke={INK}
            strokeWidth={2}
          />
          <circle cx={cx} cy={hallTop - r * 1.05 - 21} r={3} fill={INK} />
          <rect
            x={mx}
            y={ground - b.h - 60}
            width={14}
            height={b.h + 60}
            fill={PAPER}
            stroke={INK}
            strokeWidth={2.2}
          />
          <rect
            x={mx - 4}
            y={ground - b.h + 10}
            width={22}
            height={8}
            fill={PAPER}
            stroke={INK}
            strokeWidth={2}
          />
          <path
            d={`M ${mx - 2} ${ground - b.h - 60} l 9 -26 l 9 26 z`}
            fill={INK}
            stroke={INK}
            strokeWidth={1.6}
          />
        </g>
      )
    }
    case 'crane': {
      // A tower crane over a half-built frame: the city is still growing.
      const mx = b.x + b.w * 0.7
      const mastTop = ground - b.h
      const frameH = 110
      const lattice = []
      for (let y = ground - frameH; y > mastTop; y -= 18) {
        lattice.push(
          <path key={y} d={`M ${mx} ${y} L ${mx + 12} ${y - 18}`} stroke={INK} strokeWidth={1.2} />,
        )
      }
      return (
        <g>
          <rect
            x={b.x}
            y={ground - frameH}
            width={b.w}
            height={frameH}
            fill="none"
            stroke={INK}
            strokeWidth={2}
          />
          {[0.33, 0.66].map((f) => (
            <line
              key={f}
              x1={b.x + b.w * f}
              y1={ground - frameH}
              x2={b.x + b.w * f}
              y2={ground}
              stroke={INK}
              strokeWidth={1.6}
            />
          ))}
          <line
            x1={b.x}
            y1={ground - frameH / 2}
            x2={b.x + b.w}
            y2={ground - frameH / 2}
            stroke={INK}
            strokeWidth={1.6}
          />
          <line x1={mx} y1={ground - frameH} x2={mx} y2={mastTop} stroke={INK} strokeWidth={2} />
          <line
            x1={mx + 12}
            y1={ground - frameH}
            x2={mx + 12}
            y2={mastTop}
            stroke={INK}
            strokeWidth={2}
          />
          {lattice}
          <line
            x1={mx - 150}
            y1={mastTop}
            x2={mx + 60}
            y2={mastTop}
            stroke={INK}
            strokeWidth={2.4}
          />
          <line
            x1={mx + 6}
            y1={mastTop - 26}
            x2={mx - 150}
            y2={mastTop}
            stroke={INK}
            strokeWidth={1.4}
          />
          <line
            x1={mx + 6}
            y1={mastTop - 26}
            x2={mx + 60}
            y2={mastTop}
            stroke={INK}
            strokeWidth={1.4}
          />
          <rect x={mx + 40} y={mastTop} width={20} height={14} fill={INK} />
          <line
            x1={mx - 110}
            y1={mastTop}
            x2={mx - 110}
            y2={mastTop + 90}
            stroke={INK}
            strokeWidth={1.2}
          />
          <rect
            x={mx - 118}
            y={mastTop + 90}
            width={16}
            height={10}
            fill={PAPER}
            stroke={INK}
            strokeWidth={1.6}
          />
        </g>
      )
    }
    default:
      return (
        <g>
          {body}
          {shade}
          <Windows b={b} top={top} />
        </g>
      )
  }
}

/**
 * The city behind the crowd: ink outlines on paper, in the same hand-drawn spirit as the people.
 * Static SVG (no animation, no interaction). Bottom-anchored and cropped at the sides, so the
 * middle of the skyline (dome, crane) stays in view on phones.
 */
export function Skyline({ className }: { className?: string }) {
  const buildings = useMemo(() => buildSkyline(), [])
  return (
    <svg
      aria-hidden="true"
      viewBox={`0 0 ${SKY_W} ${SKY_H}`}
      preserveAspectRatio="xMidYMax slice"
      className={className}
      strokeLinejoin="round"
      strokeLinecap="round"
    >
      <defs>
        <pattern
          id="ink-hatch"
          width="7"
          height="7"
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(45)"
        >
          <line x1="0" y1="0" x2="0" y2="7" stroke={INK} strokeWidth="1.2" />
        </pattern>
      </defs>
      {buildings.map((b) => (
        <BuildingShape key={`${b.kind}-${b.x}`} b={b} />
      ))}
      <line x1="0" y1={ground - 1} x2={SKY_W} y2={ground - 1} stroke={INK} strokeWidth={2.4} />
    </svg>
  )
}
