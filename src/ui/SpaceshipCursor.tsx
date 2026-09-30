import { useEffect, useRef, useSyncExternalStore } from 'react'
import { useReducedMotion } from '../hooks/useReducedMotion'

/**
 * Desktop-only spaceship cursor, drawn on one lightweight 2D canvas overlay.
 * The ship eases after the pointer and banks toward its direction of travel,
 * leaving a faint thruster trail. A small dot marks the exact hotspot so
 * clicks stay precise. Over text fields the native cursor returns. The draw
 * loop sleeps whenever nothing is moving.
 */

const FINE_POINTER = '(hover: hover) and (pointer: fine)'
const EDITABLE = 'input, textarea, select, [contenteditable="true"]'
/** Modal dialogs render in the top layer, above this canvas: use the native cursor there. */
const NATIVE_CURSOR = `${EDITABLE}, dialog[open]`
const INTERACTIVE = 'a, button, [role="button"], label, summary, [tabindex]:not([tabindex="-1"])'
const MAX_PARTICLES = 70

function subscribeFine(cb: () => void) {
  const mql = window.matchMedia(FINE_POINTER)
  mql.addEventListener('change', cb)
  return () => mql.removeEventListener('change', cb)
}
const hasFinePointer = () => window.matchMedia(FINE_POINTER).matches

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  max: number
  size: number
}

/** Ship silhouette pointing along +x, ~22px long, nose at the origin. */
function drawShip(ctx: CanvasRenderingContext2D, thrust: number, hot: number) {
  // engine glow
  const glow = ctx.createRadialGradient(-19, 0, 0, -19, 0, 9 + thrust * 6)
  glow.addColorStop(0, `rgba(255,190,110,${0.55 + thrust * 0.4})`)
  glow.addColorStop(1, 'rgba(255,122,24,0)')
  ctx.fillStyle = glow
  ctx.beginPath()
  ctx.arc(-19, 0, 9 + thrust * 6, 0, Math.PI * 2)
  ctx.fill()

  // hull
  ctx.beginPath()
  ctx.moveTo(0, 0)
  ctx.lineTo(-20, -8)
  ctx.lineTo(-16, 0)
  ctx.lineTo(-20, 8)
  ctx.closePath()
  const hull = ctx.createLinearGradient(-20, -8, 0, 8)
  hull.addColorStop(0, '#9aa7c7')
  hull.addColorStop(1, '#eef3ff')
  ctx.fillStyle = hull
  ctx.fill()
  ctx.lineWidth = 1
  ctx.strokeStyle = `rgba(94,231,255,${0.35 + hot * 0.6})`
  ctx.stroke()

  // cockpit
  ctx.beginPath()
  ctx.ellipse(-8, 0, 3, 1.8, 0, 0, Math.PI * 2)
  ctx.fillStyle = '#5ee7ff'
  ctx.fill()
}

export default function SpaceshipCursor() {
  const fine = useSyncExternalStore(subscribeFine, hasFinePointer, () => false)
  const reduced = useReducedMotion()
  const enabled = fine && !reduced
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!enabled) return
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return

    const root = document.documentElement
    root.classList.add('has-ship-cursor')

    let dpr = 1
    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = Math.round(window.innerWidth * dpr)
      canvas.height = Math.round(window.innerHeight * dpr)
    }
    resize()

    const pointer = { x: -100, y: -100, seen: false, inside: false, overField: false, hot: false }
    const ship = { x: -100, y: -100, angle: -Math.PI / 4, thrust: 0, hot: 0, alpha: 0 }
    const particles: Particle[] = []
    let raf = 0
    let last = performance.now()
    let lastMove = 0

    const tick = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05)
      last = now

      const follow = 1 - Math.exp(-dt * 13)
      const dx = pointer.x - ship.x
      const dy = pointer.y - ship.y
      const px = ship.x
      const py = ship.y
      ship.x += dx * follow
      ship.y += dy * follow
      const vx = (ship.x - px) / Math.max(dt, 1e-3)
      const vy = (ship.y - py) / Math.max(dt, 1e-3)
      const speed = Math.hypot(vx, vy)

      // Bank toward the direction of travel (shortest way around)
      if (speed > 25) {
        const target = Math.atan2(vy, vx)
        let diff = target - ship.angle
        diff = Math.atan2(Math.sin(diff), Math.cos(diff))
        ship.angle += diff * (1 - Math.exp(-dt * 10))
      }
      ship.thrust += (Math.min(speed / 900, 1) - ship.thrust) * (1 - Math.exp(-dt * 8))
      ship.hot += ((pointer.hot ? 1 : 0) - ship.hot) * (1 - Math.exp(-dt * 12))
      const visible = pointer.inside && pointer.seen && !pointer.overField
      ship.alpha += ((visible ? 1 : 0) - ship.alpha) * (1 - Math.exp(-dt * 14))

      // Thruster trail from the tail
      if (visible && speed > 40 && particles.length < MAX_PARTICLES) {
        const n = Math.min(3, Math.ceil(speed / 500))
        const tx = ship.x - Math.cos(ship.angle) * 18
        const ty = ship.y - Math.sin(ship.angle) * 18
        for (let i = 0; i < n; i++) {
          const spread = (Math.random() - 0.5) * 0.6
          const back = ship.angle + Math.PI + spread
          particles.push({
            x: tx,
            y: ty,
            vx: Math.cos(back) * (30 + Math.random() * 40),
            vy: Math.sin(back) * (30 + Math.random() * 40),
            life: 0,
            max: 0.3 + Math.random() * 0.25,
            size: 1.4 + Math.random() * 1.8,
          })
        }
      }

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr)

      ctx.globalCompositeOperation = 'lighter'
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i]
        p.life += dt
        if (p.life >= p.max) {
          particles.splice(i, 1)
          continue
        }
        p.x += p.vx * dt
        p.y += p.vy * dt
        const k = 1 - p.life / p.max
        ctx.fillStyle = `rgba(${Math.round(255 - 160 * (1 - k))},${Math.round(170 + 60 * (1 - k))},${Math.round(90 + 165 * (1 - k))},${0.55 * k * ship.alpha})`
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size * k, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.globalCompositeOperation = 'source-over'

      if (ship.alpha > 0.01) {
        ctx.globalAlpha = ship.alpha
        // Exact hotspot: small dot, ring over clickable things
        ctx.beginPath()
        ctx.arc(pointer.x, pointer.y, 1.6, 0, Math.PI * 2)
        ctx.fillStyle = '#ffffff'
        ctx.fill()
        if (ship.hot > 0.02) {
          ctx.beginPath()
          ctx.arc(pointer.x, pointer.y, 6 + 4 * ship.hot, 0, Math.PI * 2)
          ctx.strokeStyle = `rgba(94,231,255,${0.8 * ship.hot})`
          ctx.lineWidth = 1.2
          ctx.stroke()
        }

        ctx.save()
        // Trail the pointer slightly so the ship never covers the hotspot
        ctx.translate(ship.x - Math.cos(ship.angle) * 10, ship.y - Math.sin(ship.angle) * 10)
        ctx.rotate(ship.angle)
        drawShip(ctx, ship.thrust, ship.hot)
        ctx.restore()
        ctx.globalAlpha = 1
      }

      // Sleep once everything has settled
      const settled = Math.hypot(dx, dy) < 0.3 && particles.length === 0 && now - lastMove > 400
      const faded = !visible && ship.alpha < 0.01
      if ((settled && Math.abs(ship.alpha - (visible ? 1 : 0)) < 0.01) || (faded && particles.length === 0)) {
        raf = 0
        return
      }
      raf = requestAnimationFrame(tick)
    }

    const wake = () => {
      if (!raf) {
        last = performance.now()
        raf = requestAnimationFrame(tick)
      }
    }

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return
      pointer.x = e.clientX
      pointer.y = e.clientY
      if (!pointer.seen) {
        ship.x = e.clientX - 30
        ship.y = e.clientY + 30
      }
      pointer.seen = true
      pointer.inside = true
      const target = e.target instanceof Element ? e.target : null
      pointer.overField = Boolean(target?.closest(NATIVE_CURSOR))
      pointer.hot = Boolean(target?.closest(INTERACTIVE)) || document.body.style.cursor === 'pointer'
      lastMove = performance.now()
      wake()
    }
    const onLeave = (e: MouseEvent) => {
      if (!e.relatedTarget) {
        pointer.inside = false
        wake()
      }
    }

    window.addEventListener('pointermove', onMove, { passive: true })
    document.addEventListener('mouseout', onLeave)
    window.addEventListener('resize', resize)

    return () => {
      cancelAnimationFrame(raf)
      root.classList.remove('has-ship-cursor')
      window.removeEventListener('pointermove', onMove)
      document.removeEventListener('mouseout', onLeave)
      window.removeEventListener('resize', resize)
    }
  }, [enabled])

  if (!enabled) return null
  return (
    <canvas ref={canvasRef} aria-hidden="true" className="pointer-events-none fixed inset-0 z-[80] h-full w-full" />
  )
}
