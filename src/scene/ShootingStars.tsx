import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import { AdditiveBlending, CanvasTexture, MathUtils, Vector3, type Sprite } from 'three'
import { prefersReducedMotion } from '../hooks/useReducedMotion'

const POOL = 2
const DISTANCE = 320 // far behind the planets, in front of the backdrop
const MIN_GAP = 4 // seconds between streaks
const MAX_GAP = 11

/** Horizontal streak: bright head on the right fading to a transparent tail. */
function useStreakTexture() {
  return useMemo(() => {
    const w = 256
    const h = 16
    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')!
    const g = ctx.createLinearGradient(0, 0, w, 0)
    g.addColorStop(0, 'rgba(160,210,255,0)')
    g.addColorStop(0.75, 'rgba(190,225,255,0.45)')
    g.addColorStop(1, 'rgba(255,255,255,1)')
    ctx.fillStyle = g
    // taper toward the tail
    ctx.beginPath()
    ctx.moveTo(0, h / 2)
    ctx.lineTo(w - 6, h / 2 - 3)
    ctx.arc(w - 6, h / 2, 3, -Math.PI / 2, Math.PI / 2)
    ctx.lineTo(0, h / 2)
    ctx.fill()
    return new CanvasTexture(canvas)
  }, [])
}

interface Streak {
  active: boolean
  t: number
  duration: number
  start: Vector3
  velocity: Vector3
  angle: number
  length: number
}

const forward = new Vector3()
const right = new Vector3()
const up = new Vector3()

/** Occasional meteors streaking across the background. Disabled for reduced motion. */
export default function ShootingStars() {
  const map = useStreakTexture()
  const sprites = useRef<(Sprite | null)[]>([])
  const streaks = useMemo<Streak[]>(
    () =>
      Array.from({ length: POOL }, () => ({
        active: false,
        t: 0,
        duration: 1,
        start: new Vector3(),
        velocity: new Vector3(),
        angle: 0,
        length: 30,
      })),
    [],
  )
  const nextIn = useRef(MathUtils.randFloat(2, 5))

  useFrame(({ camera }, dt) => {
    const reduced = prefersReducedMotion()
    nextIn.current -= dt

    if (!reduced && nextIn.current <= 0) {
      nextIn.current = MathUtils.randFloat(MIN_GAP, MAX_GAP)
      const s = streaks.find((x) => !x.active)
      if (s) {
        // Spawn somewhere in the upper part of the current view, moving across it
        camera.getWorldDirection(forward)
        right.setFromMatrixColumn(camera.matrixWorld, 0)
        up.setFromMatrixColumn(camera.matrixWorld, 1)
        const spread = DISTANCE * 0.45
        s.start
          .copy(camera.position)
          .addScaledVector(forward, DISTANCE)
          .addScaledVector(right, MathUtils.randFloatSpread(spread * 2))
          .addScaledVector(up, MathUtils.randFloat(0, spread * 0.8))
        // Mostly sideways and slightly downward, like a real meteor
        const drop = MathUtils.randFloat(0.15, 0.55)
        s.angle = Math.random() < 0.5 ? -drop : Math.PI + drop
        const speed = MathUtils.randFloat(140, 220)
        s.velocity
          .copy(right)
          .multiplyScalar(Math.cos(s.angle) * speed)
          .addScaledVector(up, Math.sin(s.angle) * speed)
        s.duration = MathUtils.randFloat(0.7, 1.2)
        s.length = MathUtils.randFloat(22, 38)
        s.t = 0
        s.active = true
      }
    }

    streaks.forEach((s, i) => {
      const sprite = sprites.current[i]
      if (!sprite) return
      if (!s.active) {
        sprite.visible = false
        return
      }
      s.t += dt
      const k = s.t / s.duration
      if (k >= 1 || reduced) {
        s.active = false
        sprite.visible = false
        return
      }
      sprite.visible = true
      sprite.position.copy(s.start).addScaledVector(s.velocity, s.t)
      sprite.material.rotation = s.angle
      const envelope = Math.sin(Math.PI * k) // fade in, then out
      sprite.material.opacity = envelope
      sprite.scale.set(s.length * (0.4 + 0.6 * envelope), 0.9, 1)
    })
  })

  return (
    <>
      {streaks.map((_, i) => (
        <sprite
          key={i}
          ref={(el) => {
            sprites.current[i] = el
          }}
          center={[1, 0.5]} // anchor at the head so the tail trails behind
          visible={false}
          raycast={() => null}
        >
          <spriteMaterial map={map} blending={AdditiveBlending} depthWrite={false} transparent toneMapped={false} />
        </sprite>
      ))}
    </>
  )
}
