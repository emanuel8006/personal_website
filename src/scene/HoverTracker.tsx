import { useFrame } from '@react-three/fiber'
import { Vector3 } from 'three'
import { useAppStore } from '../store'
import { hud } from '../ui/hudRefs'
import { bodyRegistry, moonRegistry, satelliteRegistry } from './registry'

const GAP = 14 // px between the body's edge and the tooltip
const MARGIN = 12 // px from the viewport edge

const center = new Vector3()
const edge = new Vector3()
const camRight = new Vector3()
const worldScale = new Vector3()

/**
 * Pins the DOM tooltip beside the hovered body every frame: projects the
 * body's center and its right-hand silhouette edge to screen space, then
 * places the tooltip just outside (flipping to the left near the edge).
 */
export default function HoverTracker() {
  useFrame(({ camera, size }) => {
    const el = hud.tooltip
    if (!el) return
    // A hovered satellite / project moon takes precedence over its planet
    const { hovered, hoveredProject, hoveredSocial } = useAppStore.getState()
    const entry = hoveredSocial
      ? satelliteRegistry.get(hoveredSocial)
      : hoveredProject
        ? moonRegistry.get(hoveredProject)
      : hovered
        ? bodyRegistry.get(hovered)
        : undefined
    if (!entry) return

    entry.object.getWorldPosition(center)
    entry.object.getWorldScale(worldScale)
    camRight.setFromMatrixColumn(camera.matrixWorld, 0)
    edge.copy(center).addScaledVector(camRight, entry.radius * worldScale.x)

    center.project(camera)
    edge.project(camera)
    if (center.z > 1) {
      el.style.visibility = 'hidden' // behind the camera
      return
    }
    el.style.visibility = ''

    const x = (center.x * 0.5 + 0.5) * size.width
    const y = (-center.y * 0.5 + 0.5) * size.height
    const r = Math.abs(edge.x - center.x) * 0.5 * size.width
    const w = el.offsetWidth

    let left = x + r + GAP
    if (left + w > size.width - MARGIN) left = x - r - GAP - w
    el.style.transform = `translate3d(${Math.round(left)}px, ${Math.round(y)}px, 0) translateY(-50%)`
  })
  return null
}
