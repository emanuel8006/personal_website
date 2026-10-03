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

/* ── Size knobs: tweak these to resize the cursor ─────────────────────────── */
/** Spaceship size multiplier (1 = ~22px long). The thruster trail scales with it. */
const SHIP_SCALE = 1.2
/** Radius (px) of the white dot marking the exact click point. */
const DOT_RADIUS = 3.2
/** Radius (px) of the cyan ring shown over clickable things, and how much it grows. */
const RING_RADIUS = 6
const RING_GROW = 4
const RING_WIDTH = 1.2
/** How far (px) the ship sits behind the dot so it never covers it. */
const SHIP_OFFSET = 10
/* ─────────────────────────────────────────────────────────────────────────── */

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

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v)

/** Last known pointer position, kept across remounts so the ship reappears immediately. */
const lastPointer = { x: 0, y: 0, seen: false }

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
      // Assigning width also fully resets the 2D context state
      canvas.width = Math.round(window.innerWidth * dpr)
      canvas.height = Math.round(window.innerHeight * dpr)
    }
    resize()

    // Resume from the last known position (remounts: HMR, StrictMode) instead of waiting for a move
    const pointer = {
      x: lastPointer.x,
      y: lastPointer.y,
      seen: lastPointer.seen,
      inside: lastPointer.seen,
      overField: false,
      hot: false,
    }
    const ship = { x: pointer.x, y: pointer.y, angle: -Math.PI / 4, thrust: 0, hot: 0, alpha: 0 }
    const particles: Particle[] = []
    /** Id of the pending animation frame; 0 means the loop is asleep. */
    let raf = 0
    let disposed = false
    let warned = false
    let last = performance.now()
    let lastMove = 0

    /**
     * Re-check what is actually under the pointer. Uses hit-testing rather than
     * event targets, so it stays correct when content scrolls or changes under
     * a still mouse, or while the browser routes events to a drag's origin.
     */
    const refreshTarget = () => {
      if (!pointer.seen) return false
      const el = document.elementFromPoint(pointer.x, pointer.y)
      const overField = Boolean(el?.closest(NATIVE_CURSOR))
      const hot = Boolean(el?.closest(INTERACTIVE)) || document.body.style.cursor === 'pointer'
      const changed = overField !== pointer.overField || hot !== pointer.hot
      pointer.overField = overField
      pointer.hot = hot
      return changed
    }

    /** One animation frame. Returns false when everything has settled (loop can sleep). */
    const frame = (now: number) => {
      // rAF timestamps can be slightly older than the wake-up time: never step backwards
      const dt = Math.min(Math.max((now - last) / 1000, 0), 0.05)
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
      ship.thrust = clamp01(ship.thrust + (Math.min(speed / 900, 1) - ship.thrust) * (1 - Math.exp(-dt * 8)))
      ship.hot = clamp01(ship.hot + ((pointer.hot ? 1 : 0) - ship.hot) * (1 - Math.exp(-dt * 12)))
      const visible = pointer.inside && pointer.seen && !pointer.overField
      ship.alpha = clamp01(ship.alpha + ((visible ? 1 : 0) - ship.alpha) * (1 - Math.exp(-dt * 14)))

      // Thruster trail from the tail
      if (visible && speed > 40 && particles.length < MAX_PARTICLES) {
        const n = Math.min(3, Math.ceil(speed / 500))
        // Tail of the ship (it's ~18px from the nose at scale 1)
        const tail = SHIP_OFFSET + 18 * SHIP_SCALE
        const tx = ship.x - Math.cos(ship.angle) * tail
        const ty = ship.y - Math.sin(ship.angle) * tail
        for (let i = 0; i < n; i++) {
          const spread = (Math.random() - 0.5) * 0.6
          const back = ship.angle + Math.PI + spread
          particles.push({
            x: tx,
            y: ty,
            vx: Math.cos(back) * (30 + Math.random() * 40) * SHIP_SCALE,
            vy: Math.sin(back) * (30 + Math.random() * 40) * SHIP_SCALE,
            life: 0,
            max: 0.3 + Math.random() * 0.25,
            size: (1.4 + Math.random() * 1.8) * SHIP_SCALE,
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
        ctx.arc(p.x, p.y, Math.max(0, p.size * k), 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.globalCompositeOperation = 'source-over'

      if (ship.alpha > 0.01) {
        ctx.globalAlpha = ship.alpha
        // Exact hotspot: small dot, ring over clickable things
        ctx.beginPath()
        ctx.arc(pointer.x, pointer.y, Math.max(0, DOT_RADIUS), 0, Math.PI * 2)
        ctx.fillStyle = '#ffffff'
        ctx.fill()
        if (ship.hot > 0.02) {
          ctx.beginPath()
          ctx.arc(pointer.x, pointer.y, Math.max(0, RING_RADIUS + RING_GROW * ship.hot), 0, Math.PI * 2)
          ctx.strokeStyle = `rgba(94,231,255,${0.8 * ship.hot})`
          ctx.lineWidth = RING_WIDTH
          ctx.stroke()
        }

        ctx.save()
        // Trail the pointer slightly so the ship never covers the hotspot
        ctx.translate(ship.x - Math.cos(ship.angle) * SHIP_OFFSET, ship.y - Math.sin(ship.angle) * SHIP_OFFSET)
        ctx.rotate(ship.angle)
        ctx.scale(SHIP_SCALE, SHIP_SCALE)
        drawShip(ctx, ship.thrust, ship.hot)
        ctx.restore()
        ctx.globalAlpha = 1
      }

      // Sleep once everything has settled
      const settled = Math.hypot(dx, dy) < 0.3 && particles.length === 0 && now - lastMove > 400
      const faded = !visible && ship.alpha < 0.01
      return !((settled && Math.abs(ship.alpha - (visible ? 1 : 0)) < 0.01) || (faded && particles.length === 0))
    }

    const tick = (now: number) => {
      // This frame is no longer pending. If anything below throws, the next event can still
      // restart the loop (previously a single bad frame stopped the cursor for good).
      raf = 0
      let again = false
      try {
        again = frame(now)
      } catch (err) {
        if (!warned) {
          warned = true
          console.warn('[cursor] frame failed; recovering', err)
        }
        // Start clean: reset the canvas state and snap the ship to the pointer
        particles.length = 0
        ship.x = pointer.x
        ship.y = pointer.y
        ship.thrust = 0
        ship.hot = 0
        resize()
      }
      if (again && !disposed) raf = requestAnimationFrame(tick)
    }

    const wake = () => {
      if (!raf && !disposed) {
        last = performance.now()
        raf = requestAnimationFrame(tick)
      }
    }

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return
      pointer.x = lastPointer.x = e.clientX
      pointer.y = lastPointer.y = e.clientY
      if (!pointer.seen) {
        ship.x = e.clientX - 30
        ship.y = e.clientY + 30
      }
      pointer.seen = lastPointer.seen = true
      pointer.inside = true
      refreshTarget()
      lastMove = performance.now()
      wake()
    }
    // Only a real exit from the page hides the ship. (mouseout with no relatedTarget also
    // fires when the element under the pointer is removed, e.g. switching views.)
    const onLeave = () => {
      pointer.inside = false
      wake()
    }
    const onEnter = () => {
      pointer.inside = true
      refreshTarget()
      wake()
    }
    // Content moved under a still pointer (scrolling, panels opening, view switches)
    const onContentChange = () => {
      if (refreshTarget()) wake()
    }
    const onResize = () => {
      resize()
      refreshTarget()
      wake()
    }
    const onVisible = () => {
      if (document.visibilityState === 'visible') wake()
    }
    const recheck = window.setInterval(() => {
      if (pointer.seen && pointer.inside) onContentChange()
    }, 300)

    window.addEventListener('pointermove', onMove, { passive: true })
    root.addEventListener('mouseleave', onLeave)
    root.addEventListener('mouseenter', onEnter)
    window.addEventListener('scroll', onContentChange, { capture: true, passive: true })
    window.addEventListener('resize', onResize)
    document.addEventListener('visibilitychange', onVisible)
    canvas.addEventListener('contextrestored', wake) // the browser can drop and restore 2D canvases
    if (pointer.seen) {
      refreshTarget()
      wake()
    }

    return () => {
      disposed = true
      cancelAnimationFrame(raf)
      window.clearInterval(recheck)
      root.classList.remove('has-ship-cursor')
      window.removeEventListener('pointermove', onMove)
      root.removeEventListener('mouseleave', onLeave)
      root.removeEventListener('mouseenter', onEnter)
      window.removeEventListener('scroll', onContentChange, { capture: true })
      window.removeEventListener('resize', onResize)
      document.removeEventListener('visibilitychange', onVisible)
      canvas.removeEventListener('contextrestored', wake)
    }
  }, [enabled])

  if (!enabled) return null
  return (
    <canvas ref={canvasRef} aria-hidden="true" className="pointer-events-none fixed inset-0 z-[80] h-full w-full" />
  )
}
