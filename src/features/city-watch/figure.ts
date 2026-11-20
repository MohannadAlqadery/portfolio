import type { Walker } from './scene'

/**
 * A pedestrian silhouette with real proportions (a head about 1/7.5 of the body), two-segment
 * legs and arms, and a walk cycle: the swinging leg bends at the knee, arms swing opposite the
 * legs and the body bobs a little at each step. `phase` comes from `gait()`.
 */
export function drawFigure(
  ctx: CanvasRenderingContext2D,
  w: Walker,
  x: number,
  feet: number,
  size: number,
  phase: number,
  color: string,
  glow: string | null,
) {
  const dir = w.dir
  const walking = w.pace > 0
  const bob = walking
    ? Math.abs(Math.sin(phase)) * size * 0.012
    : Math.sin(phase * 0.15) * size * 0.003
  const top = feet - size + bob
  const r = size * 0.066
  const headX = x + dir * size * 0.012
  const headY = top + r
  const neckY = headY + r * 1.05
  const shoulderY = neckY + size * 0.03
  const hipY = feet - size * 0.49
  const half = size * 0.115 * w.build
  const thigh = size * 0.25
  const shin = size * 0.25

  ctx.fillStyle = color
  ctx.strokeStyle = color
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'

  // Legs: hip swing, knee bends on the forward swing.
  const leg = (p: number) => {
    const swing = walking ? Math.sin(p) * 0.42 : 0.04
    const knee = walking ? 0.08 + Math.max(0, Math.cos(p)) * 0.7 : 0.05
    const a = swing * dir
    const kx = x + Math.sin(a) * thigh
    const ky = hipY + Math.cos(a) * thigh
    const b = a - knee * dir
    ctx.beginPath()
    ctx.moveTo(x, hipY)
    ctx.lineTo(kx, ky)
    ctx.lineTo(kx + Math.sin(b) * shin, Math.min(feet, ky + Math.cos(b) * shin))
    // A short foot in the walking direction.
    ctx.lineTo(
      kx + Math.sin(b) * shin + dir * size * 0.045,
      Math.min(feet, ky + Math.cos(b) * shin),
    )
    ctx.stroke()
  }
  ctx.lineWidth = size * 0.068
  leg(phase)
  leg(phase + Math.PI)

  // Torso and coat: rounded shoulders, slight taper, a hem that flares for long coats.
  const hem = hipY + size * (0.04 + w.coat * 0.24)
  const flare = half * (0.9 + w.coat * 0.25)
  ctx.beginPath()
  ctx.moveTo(x - half * 0.4, neckY)
  ctx.quadraticCurveTo(x - half, shoulderY - size * 0.01, x - half, shoulderY + size * 0.05)
  ctx.lineTo(x - flare, hem)
  ctx.lineTo(x + flare, hem)
  ctx.lineTo(x + half, shoulderY + size * 0.05)
  ctx.quadraticCurveTo(x + half, shoulderY - size * 0.01, x + half * 0.4, neckY)
  ctx.closePath()
  ctx.fill()

  if (w.backpack) {
    ctx.beginPath()
    ctx.roundRect(
      x - dir * half * 1.05 - (dir > 0 ? size * 0.06 : 0),
      shoulderY + size * 0.03,
      size * 0.06,
      size * 0.17,
      size * 0.02,
    )
    ctx.fill()
  }

  // Arms: upper arm and forearm, swinging against the legs.
  const arm = (side: number, p: number, hold: 'phone' | 'umbrella' | null) => {
    const sx = x + side * half * 0.8
    const sy = shoulderY + size * 0.025
    let a: number
    let elbow: number
    if (hold === 'phone') {
      a = 0.25 * dir
      elbow = 1.7 * dir
    } else if (hold === 'umbrella') {
      a = 0.5 * dir
      elbow = 1.9 * dir
    } else {
      a = walking ? -Math.sin(p) * 0.38 * dir : 0.05 * side
      elbow = walking ? (0.25 + Math.max(0, -Math.cos(p)) * 0.35) * dir : 0.1 * dir
    }
    const ex = sx + Math.sin(a) * size * 0.16
    const ey = sy + Math.cos(a) * size * 0.16
    const b = a + elbow
    const hx = ex + Math.sin(b) * size * 0.15
    const hy = ey + Math.cos(b) * size * 0.15
    ctx.beginPath()
    ctx.moveTo(sx, sy)
    ctx.lineTo(ex, ey)
    ctx.lineTo(hx, hy)
    ctx.stroke()
    return { hx, hy }
  }
  ctx.lineWidth = size * 0.05
  arm(-dir, phase, null)
  const hold = w.umbrella ? 'umbrella' : w.phone ? 'phone' : null
  const front = arm(dir, phase + Math.PI, hold)

  // Head: hood or cap.
  ctx.beginPath()
  ctx.ellipse(
    headX,
    headY,
    r * (w.hood ? 1.2 : 0.92),
    r * (w.hood ? 1.18 : 1.05),
    0,
    0,
    Math.PI * 2,
  )
  ctx.fill()
  if (w.cap && !w.hood) {
    ctx.beginPath()
    ctx.moveTo(headX - dir * r * 0.4, headY - r * 0.55)
    ctx.lineTo(headX + dir * r * 1.7, headY - r * 0.35)
    ctx.lineWidth = size * 0.02
    ctx.stroke()
  }

  if (hold === 'umbrella') {
    const px = front.hx
    const tipY = top - size * 0.16
    ctx.lineWidth = size * 0.014
    ctx.beginPath()
    ctx.moveTo(px, front.hy)
    ctx.lineTo(px, tipY)
    ctx.stroke()
    // Canopy with scalloped edge.
    const span = size * 0.36
    ctx.beginPath()
    ctx.moveTo(px - span, tipY + size * 0.08)
    ctx.quadraticCurveTo(px, tipY - size * 0.1, px + span, tipY + size * 0.08)
    for (let i = 4; i > 0; i--) {
      const x0 = px - span + (span * 2 * i) / 4
      ctx.quadraticCurveTo(x0 - span / 4, tipY + size * 0.045, x0 - span / 2, tipY + size * 0.08)
    }
    ctx.closePath()
    ctx.fill()
  }

  // A lit phone screen: the only light most people carry.
  if (hold === 'phone' && glow) {
    const sx = front.hx + dir * size * 0.01
    const sy = front.hy - size * 0.02
    ctx.save()
    ctx.shadowColor = glow
    ctx.shadowBlur = size * 0.12
    ctx.fillStyle = glow
    ctx.fillRect(sx - size * 0.012, sy - size * 0.022, size * 0.024, size * 0.04)
    ctx.restore()
  }
}
