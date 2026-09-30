import { useFrame, type ThreeEvent } from '@react-three/fiber'
import { easing } from 'maath'
import { useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import {
  Color,
  IcosahedronGeometry,
  MathUtils,
  Matrix4,
  Quaternion,
  Vector3,
  type Group,
  type InstancedMesh,
  type MeshStandardMaterial,
} from 'three'
import { mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { TIER_SETTINGS } from '../lib/capability'
import { useAppStore } from '../store'
import { applyDim, canInteract } from './interaction'
import { specialAsteroid, simulation } from './registry'

/** Between Mars (48) and Jupiter (80). */
const INNER = 56
const OUTER = 68
const THICKNESS = 1.6 // ~1σ vertical spread
const SPIN = 0.01 // rad/s for the whole belt
const MAX_COUNT = TIER_SETTINGS.high.asteroids
const CLICK_SLOP = 6

/** Deterministic PRNG so the belt (and the special asteroid's spot) is the same every visit. */
function mulberry32(seed: number) {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** A lumpy rock: icosahedron with welded vertices pushed in/out. */
function useRockGeometry(seed: number, detail = 1) {
  const geometry = useMemo(() => {
    const rand = mulberry32(seed)
    const g = mergeVertices(new IcosahedronGeometry(1, detail))
    const pos = g.attributes.position
    const v = new Vector3()
    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i).multiplyScalar(0.72 + rand() * 0.5)
      pos.setXYZ(i, v.x, v.y * 0.8, v.z)
    }
    g.computeVertexNormals()
    return g
  }, [seed, detail])
  useEffect(() => () => geometry.dispose(), [geometry])
  return geometry
}

function randomNormal(rand: () => number) {
  // Box–Muller
  return Math.sqrt(-2 * Math.log(rand() || 1e-6)) * Math.cos(2 * Math.PI * rand())
}

/**
 * The easter egg: a slightly larger rock with a faint violet pulse. Clicking it
 * reveals Planet X. Tooltip hints that something is off about it.
 */
function SpecialAsteroid() {
  const geometry = useRockGeometry(7, 1)
  const group = useRef<Group>(null)
  const material = useRef<MeshStandardMaterial>(null)
  const hover = useRef({ value: 0 })
  const position = useMemo(() => {
    const a = 2.1 // radians around the belt
    const r = (INNER + OUTER) / 2
    return new Vector3(Math.cos(a) * r, 0.9, -Math.sin(a) * r)
  }, [])

  useFrame(({ clock }, dt) => {
    const hovered = useAppStore.getState().hoveredAsteroid
    easing.damp(hover.current, 'value', hovered ? 1 : 0, 0.15, dt)
    if (group.current) {
      group.current.rotation.x += dt * 0.25
      group.current.rotation.y += dt * 0.18
      group.current.scale.setScalar(1 + 0.35 * hover.current.value)
    }
    if (material.current) {
      const pulse = 0.35 + 0.35 * Math.sin(clock.elapsedTime * 1.6)
      material.current.emissiveIntensity = pulse + 1.4 * hover.current.value
    }
  })

  const handlers = useMemo(
    () => ({
      onPointerOver: (e: ThreeEvent<PointerEvent>) => {
        if (!canInteract()) return
        e.stopPropagation()
        useAppStore.getState().setHoveredAsteroid(true)
        document.body.style.cursor = 'pointer'
      },
      onPointerOut: () => {
        useAppStore.getState().setHoveredAsteroid(false)
        document.body.style.cursor = ''
      },
      onClick: (e: ThreeEvent<MouseEvent>) => {
        if (!canInteract()) return
        e.stopPropagation()
        if (e.delta > CLICK_SLOP) return
        document.body.style.cursor = ''
        useAppStore.getState().discoverPlanetX()
      },
    }),
    [],
  )

  return (
    <group
      position={position}
      ref={(g) => {
        specialAsteroid.object = g
      }}
      name="Special asteroid"
    >
      <group ref={group}>
        <mesh geometry={geometry} scale={0.85}>
          <meshStandardMaterial
            ref={material}
            color="#6d6478"
            roughness={0.85}
            metalness={0.1}
            emissive="#8b5cf6"
            emissiveIntensity={0.4}
            flatShading
          />
        </mesh>
      </group>
      <mesh visible={false} {...handlers}>
        <sphereGeometry args={[1.8, 12, 8]} />
      </mesh>
    </group>
  )
}

/** Instanced rocks between Mars and Jupiter; count follows the quality tier. */
export default function AsteroidBelt() {
  const quality = useAppStore((s) => s.quality)
  const geometry = useRockGeometry(3, 0)
  const mesh = useRef<InstancedMesh>(null)
  const belt = useRef<Group>(null)
  const dim = useRef({ value: 1 })

  // One-time instance layout (max count); lower tiers just render fewer
  useLayoutEffect(() => {
    const m = mesh.current
    if (!m) return
    const rand = mulberry32(42)
    const matrix = new Matrix4()
    const q = new Quaternion()
    const p = new Vector3()
    const s = new Vector3()
    const axis = new Vector3()
    const color = new Color()
    for (let i = 0; i < MAX_COUNT; i++) {
      const a = rand() * Math.PI * 2
      const r = MathUtils.lerp(INNER, OUTER, (rand() + rand()) / 2) // denser mid-belt
      p.set(Math.cos(a) * r, randomNormal(rand) * THICKNESS * 0.5, -Math.sin(a) * r)
      const size = 0.08 + Math.pow(rand(), 3) * 0.42 // mostly pebbles, a few boulders
      s.set(size, size * (0.7 + rand() * 0.5), size * (0.8 + rand() * 0.4))
      q.setFromAxisAngle(axis.randomDirection(), rand() * Math.PI * 2)
      m.setMatrixAt(i, matrix.compose(p, q, s))
      m.setColorAt(i, color.setHSL(0.07 + rand() * 0.05, 0.12 + rand() * 0.1, 0.32 + rand() * 0.16))
    }
    m.instanceMatrix.needsUpdate = true
    if (m.instanceColor) m.instanceColor.needsUpdate = true
    m.computeBoundingSphere()
  }, [])

  useFrame((_, dt) => {
    if (belt.current) belt.current.rotation.y += dt * SPIN * simulation.orbitSpeed
    // Dim with the rest of the system while a panel is open
    const target = useAppStore.getState().section ? 0.42 : 1
    const before = dim.current.value
    easing.damp(dim.current, 'value', target, 0.35, dt)
    if (belt.current && Math.abs(before - dim.current.value) > 1e-4) applyDim(belt.current, dim.current.value)
  })

  return (
    <group ref={belt} name="Asteroid belt">
      <instancedMesh
        ref={mesh}
        args={[geometry, undefined, MAX_COUNT]}
        count={TIER_SETTINGS[quality].asteroids}
        frustumCulled={false}
        raycast={() => null}
      >
        <meshStandardMaterial color="#ffffff" roughness={0.95} metalness={0.05} flatShading />
      </instancedMesh>
      <SpecialAsteroid />
    </group>
  )
}
