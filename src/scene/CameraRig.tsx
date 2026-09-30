import { CameraControls } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import CameraControlsImpl from 'camera-controls'
import { useEffect, useRef } from 'react'
import { MathUtils, Vector3, type PerspectiveCamera } from 'three'
import { prefersReducedMotion } from '../hooks/useReducedMotion'
import { useAppStore, type SectionId } from '../store'
import { frameRadius } from './bodies'
import { OVERVIEW_POSITION } from './constants'
import { bodyRegistry, flight, simulation } from './registry'

/**
 * Camera director.
 *
 * - Overview: user may orbit/zoom within limits; after a few idle seconds the
 *   view drifts slowly around the system.
 * - Flights: an eased (in-out) arc from the current pose to the destination.
 *   The destination is re-evaluated every frame (planets are still slowing to
 *   a stop), and a new request mid-flight simply starts a new arc from
 *   wherever the camera is, so flights are always interruptible.
 * - Focused: keeps the planet framed on the left third, leaving the right side
 *   for the content panel.
 *
 * All camera writes go through CameraControls so its internal state never
 * disagrees with the actual camera.
 */

const UP = new Vector3(0, 1, 0)
const OVERVIEW_POS = new Vector3(...OVERVIEW_POSITION)
const OVERVIEW_TARGET = new Vector3(0, 0, 0)

/** Planet frame radius → camera distance. ~5.4 makes the framed body ~45% of screen height at fov 45. */
const FRAME_DISTANCE = 5.4
/** Radians the camera swings off the Sun line, so focused planets read as 3/4 lit. */
const VIEW_SWING = 0.7
const IDLE_BEFORE_DRIFT = 4 // seconds
const DRIFT_SPEED = 0.012 // radians / second

const OVERVIEW_LIMITS = { minDistance: 70, maxDistance: 330, minPolarAngle: 0.3, maxPolarAngle: 1.45 }
const FREE_LIMITS = { minDistance: 0, maxDistance: Infinity, minPolarAngle: 0, maxPolarAngle: Math.PI }

const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2)

// Scratch vectors (no allocation in the render loop)
const P = new Vector3()
const dir = new Vector3()
const forward = new Vector3()
const right = new Vector3()
const endPos = new Vector3()
const endTarget = new Vector3()
const ctrl = new Vector3()
const pos = new Vector3()
const target = new Vector3()

/** Camera pose that frames `id` on the left third of the screen. */
function focusPose(id: SectionId, aspect: number, fovDeg: number, outPos: Vector3, outTarget: Vector3) {
  const entry = bodyRegistry.get(id)
  if (!entry) return false
  entry.object.getWorldPosition(P)

  // View from the sunward side, swung off-axis; the Sun itself is framed from the front.
  if (P.lengthSq() < 1e-6) dir.set(0.35, 0.28, 1)
  else dir.copy(P).negate().normalize().applyAxisAngle(UP, VIEW_SWING)
  dir.y += 0.3
  dir.normalize()

  const distance = frameRadius(id) * FRAME_DISTANCE
  outPos.copy(P).addScaledVector(dir, distance)

  // Look past the planet toward the right so it lands at x = 1/3 of the screen width.
  forward.copy(P).sub(outPos).normalize()
  right.crossVectors(forward, UP).normalize()
  const halfWidth = Math.tan(MathUtils.degToRad(fovDeg) / 2) * distance * aspect
  outTarget.copy(P).addScaledVector(right, halfWidth / 3)
  return true
}

function quadraticBezier(a: Vector3, b: Vector3, c: Vector3, t: number, out: Vector3) {
  const u = 1 - t
  return out.set(
    u * u * a.x + 2 * u * t * b.x + t * t * c.x,
    u * u * a.y + 2 * u * t * b.y + t * t * c.y,
    u * u * a.z + 2 * u * t * b.z + t * t * c.z,
  )
}

function applyLimits(c: CameraControlsImpl, limits: typeof OVERVIEW_LIMITS) {
  Object.assign(c, limits)
}

export default function CameraRig() {
  const controls = useRef<CameraControlsImpl>(null)
  const rig = useRef({
    dest: null as SectionId | null,
    flying: false,
    t: 0,
    duration: 1.7,
    fromPos: new Vector3(),
    fromTarget: new Vector3(),
    lastInteraction: 0,
    devLocked: false,
  })

  // Setup: input mapping, overview limits, interaction tracking, store subscription
  useEffect(() => {
    const c = controls.current
    if (!c) return
    const r = rig.current
    const ACTION = CameraControlsImpl.ACTION

    c.mouseButtons.right = ACTION.NONE // no panning: the Sun stays the center of attention
    c.mouseButtons.middle = ACTION.DOLLY
    c.touches.two = ACTION.TOUCH_DOLLY_ROTATE
    c.touches.three = ACTION.NONE
    c.smoothTime = 0.5
    c.draggingSmoothTime = 0.18
    applyLimits(c, OVERVIEW_LIMITS)

    // Dev only: ?cam=x,y,z&look=x,y,z pins an initial view for screenshots
    if (import.meta.env.DEV) {
      const params = new URLSearchParams(location.search)
      const cam = params.get('cam')?.split(',').map(Number)
      const look = params.get('look')?.split(',').map(Number) ?? [0, 0, 0]
      if (cam?.length === 3) {
        applyLimits(c, FREE_LIMITS)
        c.setLookAt(cam[0], cam[1], cam[2], look[0], look[1], look[2], false)
        r.devLocked = true
      }
    }

    const markInteraction = () => {
      r.lastInteraction = performance.now() / 1000
    }
    c.addEventListener('controlstart', markInteraction)
    c.addEventListener('controlend', markInteraction)

    const startFlight = (dest: SectionId | null) => {
      r.dest = dest
      r.devLocked = false
      c.getPosition(r.fromPos)
      c.getTarget(r.fromTarget)

      const cam = c.camera as PerspectiveCamera
      if (dest) focusPose(dest, cam.aspect, cam.fov, endPos, endTarget)
      else endPos.copy(OVERVIEW_POS)
      const distance = r.fromPos.distanceTo(endPos)

      // Reduced motion: effectively a cut (phase 7 adds a fade over it)
      r.duration = prefersReducedMotion() ? 0.001 : MathUtils.clamp(1.5 + distance / 300, 1.5, 2)
      r.t = 0
      r.flying = true
      c.enabled = false
      applyLimits(c, FREE_LIMITS)
      simulation.orbitSpeedTarget = dest ? 0 : 1
    }

    const unsubscribe = useAppStore.subscribe((s, prev) => {
      if (s.section !== prev.section) startFlight(s.section)
    })

    return () => {
      unsubscribe()
      c.removeEventListener('controlstart', markInteraction)
      c.removeEventListener('controlend', markInteraction)
    }
  }, [])

  useFrame((state, dt) => {
    const c = controls.current
    if (!c) return
    const r = rig.current
    const cam = state.camera as PerspectiveCamera

    // Destination pose, recomputed every frame (bodies may still be moving)
    let hasDest = true
    if (r.dest) hasDest = focusPose(r.dest, cam.aspect, cam.fov, endPos, endTarget)
    else {
      endPos.copy(OVERVIEW_POS)
      endTarget.copy(OVERVIEW_TARGET)
    }
    if (!hasDest) return

    if (r.flying) {
      r.t = Math.min(1, r.t + dt / r.duration)
      const e = easeInOutCubic(r.t)

      // Arc upward mid-flight: reads as a flight, and keeps the path clear of the Sun
      ctrl.lerpVectors(r.fromPos, endPos, 0.5)
      ctrl.y += r.fromPos.distanceTo(endPos) * 0.22
      quadraticBezier(r.fromPos, ctrl, endPos, e, pos)
      target.lerpVectors(r.fromTarget, endTarget, e)
      c.setLookAt(pos.x, pos.y, pos.z, target.x, target.y, target.z, false)

      flight.active = r.t < 1
      flight.progress = r.t
      if (r.t >= 1) {
        r.flying = false
        if (!r.dest) {
          applyLimits(c, OVERVIEW_LIMITS)
          c.enabled = true
          r.lastInteraction = performance.now() / 1000
        }
      }
      return
    }

    if (r.dest) {
      // Hold the framing (handles window resizes and any residual planet motion)
      c.setLookAt(endPos.x, endPos.y, endPos.z, endTarget.x, endTarget.y, endTarget.z, true)
      return
    }

    // Overview: slow ambient drift once the user has been idle for a moment
    const idle = performance.now() / 1000 - r.lastInteraction
    if (!r.devLocked && idle > IDLE_BEFORE_DRIFT && !prefersReducedMotion()) {
      c.rotate(dt * DRIFT_SPEED, 0, false)
    }
  })

  return <CameraControls ref={controls} makeDefault />
}
