import { useFrame, type ThreeEvent } from '@react-three/fiber'
import { easing } from 'maath'
import { useRef, type RefObject } from 'react'
import type { Color, Material, Mesh, Object3D, ShaderMaterial } from 'three'
import { useAppStore, type SectionId } from '../store'

/** Brightness of bodies that aren't the focused one while a panel is open. */
const DIM_LEVEL = 0.42
/** Pixels the pointer may travel between down and up and still count as a click (not a drag). */
const CLICK_SLOP = 6

export interface InteractionState {
  /** 0..1 hover highlight (rim glow, scale). */
  hover: number
  /** 0..1 local orbit speed multiplier (slows to a stop while hovered). */
  orbit: number
  /** Current brightness multiplier. */
  dim: number
}

/**
 * Multiplies every material's brightness under `root`: custom shaders via a
 * `uDim` uniform, built-in materials via their `color` (original saved once).
 */
export function applyDim(root: Object3D, dim: number) {
  root.traverse((o) => {
    const mat = (o as Mesh).material as Material | Material[] | undefined
    if (!mat) return
    for (const m of Array.isArray(mat) ? mat : [mat]) {
      const uniforms = (m as ShaderMaterial).uniforms
      if (uniforms) {
        if (uniforms.uDim) uniforms.uDim.value = dim
        continue
      }
      const color = (m as Material & { color?: Color }).color
      if (color?.isColor) {
        const base: Color = (m.userData.baseColor ??= color.clone())
        color.copy(base).multiplyScalar(dim)
      }
    }
  })
}

/**
 * Per-body hover / focus / dim easing, driven from the store without
 * re-rendering. `root` is dimmed; `scaleTarget` grows slightly on hover.
 */
export function useBodyInteraction(
  id: SectionId,
  root: RefObject<Object3D | null>,
  scaleTarget: RefObject<Object3D | null>,
  hoverScale = 0.06,
) {
  const state = useRef<InteractionState>({ hover: 0, orbit: 1, dim: 1 })

  useFrame((_, dt) => {
    const { hovered, section } = useAppStore.getState()
    const s = state.current
    const focused = section === id
    easing.damp(s, 'hover', hovered === id && !focused ? 1 : 0, 0.15, dt)
    easing.damp(s, 'orbit', hovered === id ? 0 : 1, 0.3, dt)
    easing.damp(s, 'dim', section && !focused ? DIM_LEVEL : 1, 0.35, dt)

    scaleTarget.current?.scale.setScalar(1 + hoverScale * s.hover)
    // Re-applied every frame while dimmed so late-loading (Suspense) meshes are covered too
    if (root.current && s.dim < 0.999) applyDim(root.current, s.dim)
    else if (root.current && s.dim !== 1) {
      s.dim = 1
      applyDim(root.current, 1)
    }
  })

  return state
}

/** Scene objects ignore the pointer until the intro has finished. */
export const canInteract = () => useAppStore.getState().intro === 'done'

/**
 * Pointer handlers for a body's invisible hit sphere. While its own section is
 * open the body is "transparent" to the pointer, so its satellites and moons
 * (which may sit behind the generous hit sphere) receive hover and clicks.
 */
export function bodyPointerHandlers(id: SectionId) {
  const isFocused = () => useAppStore.getState().section === id
  return {
    onPointerOver: (e: ThreeEvent<PointerEvent>) => {
      if (isFocused() || !canInteract()) return
      e.stopPropagation()
      useAppStore.getState().setHovered(id)
      document.body.style.cursor = 'pointer'
    },
    onPointerOut: () => {
      if (useAppStore.getState().hovered === id) useAppStore.getState().setHovered(null)
      document.body.style.cursor = ''
    },
    onClick: (e: ThreeEvent<MouseEvent>) => {
      if (isFocused() || !canInteract()) return
      e.stopPropagation()
      if (e.delta > CLICK_SLOP) return // was a camera drag
      useAppStore.getState().openSection(id)
    },
  }
}
