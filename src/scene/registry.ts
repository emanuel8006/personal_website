import type { Object3D } from 'three'
import type { SectionId } from '../store'

/**
 * Live scene objects by section, so the camera rig and minimap can read
 * positions every frame without going through React state.
 */
export const bodyRegistry = new Map<SectionId, { object: Object3D; radius: number }>()

export function registerBody(id: SectionId, object: Object3D | null, radius: number) {
  if (object) bodyRegistry.set(id, { object, radius })
  else bodyRegistry.delete(id)
}

/**
 * Global orbit-speed multiplier, eased toward a target each frame.
 * Phase 3 drives the target (0 while a panel is open, 1 in the overview).
 */
const frozen = import.meta.env.DEV && new URLSearchParams(location.search).has('freeze') // dev: stop orbits for screenshots
export const simulation = { orbitSpeed: frozen ? 0 : 1, orbitSpeedTarget: frozen ? 0 : 1 }
