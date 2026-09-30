import { useFrame } from '@react-three/fiber'
import { easing } from 'maath'
import { Suspense, useCallback, useMemo, useRef, type ReactNode } from 'react'
import type { Group, Texture } from 'three'
import Atmosphere from './Atmosphere'
import type { MoonConfig, PlanetConfig } from './bodies'
import HoverGlow from './HoverGlow'
import { bodyPointerHandlers, useBodyInteraction } from './interaction'
import { proceduralSurface } from './procedural'
import { registerBody, simulation } from './registry'
import TextureBoundary from './TextureBoundary'
import type { TextureKey } from './textures'
import { useBodyTextures } from './useBodyTextures'

/** Standard lit sphere. Rough, non-metallic, like real planetary surfaces. */
export function SurfaceMesh({ radius, map, tint }: { radius: number; map: Texture; tint?: string }) {
  return (
    <mesh>
      <sphereGeometry args={[radius, 64, 32]} />
      <meshStandardMaterial map={map} color={tint ?? '#ffffff'} roughness={0.92} metalness={0} />
    </mesh>
  )
}

/**
 * Surface using a procedural texture, generated only when this actually renders
 * (texture missing or failed). CPU noise is too costly to build up front.
 */
export function LazySurfaceMesh({ radius, getMap, tint }: { radius: number; getMap: () => Texture; tint?: string }) {
  return <SurfaceMesh radius={radius} map={getMap()} tint={tint} />
}

function TexturedSurface({ radius, textureKey, fallback, tint }: SurfaceProps) {
  const { map } = useBodyTextures({ map: textureKey })
  return map ? (
    <SurfaceMesh radius={radius} map={map} tint={tint} />
  ) : (
    <LazySurfaceMesh radius={radius} getMap={fallback} tint={tint} />
  )
}

interface SurfaceProps {
  radius: number
  textureKey: TextureKey
  /** Procedural texture factory, only called if the real texture is missing or fails. */
  fallback: () => Texture
  tint?: string
}

/** Texture if available, procedural surface if missing or failed. */
export function Surface(props: SurfaceProps) {
  const fallback = <LazySurfaceMesh radius={props.radius} getMap={props.fallback} tint={props.tint} />
  return (
    <TextureBoundary fallback={fallback}>
      <Suspense fallback={null}>
        <TexturedSurface {...props} />
      </Suspense>
    </TextureBoundary>
  )
}

/** A moon orbiting its parent's center, in the parent's (untilted) frame. */
export function Moon({ config, textureKey = 'moon' }: { config: MoonConfig; textureKey?: TextureKey }) {
  const ref = useRef<Group>(null)
  const angle = useRef(config.phase)
  const fallback = useCallback(() => proceduralSurface('rocky', ['#6d6a66', '#9a958e', '#4a4744'], 9), [])

  useFrame((_, dt) => {
    angle.current += dt * config.speed * simulation.orbitSpeed
    ref.current?.position.set(Math.cos(angle.current) * config.distance, 0, -Math.sin(angle.current) * config.distance)
    if (ref.current) ref.current.rotation.y = -angle.current // tidally locked
  })

  return (
    <group rotation-z={config.inclination ?? 0}>
      <group ref={ref}>
        <Surface radius={config.radius} textureKey={textureKey} fallback={fallback} tint={config.tint} />
      </group>
    </group>
  )
}

/** Faint circular orbit guide in the ecliptic plane. */
export function OrbitLine({ radius, opacity = 0.11 }: { radius: number; opacity?: number }) {
  const positions = useMemo(() => {
    const segments = 256
    const arr = new Float32Array(segments * 3)
    for (let i = 0; i < segments; i++) {
      const a = (i / segments) * Math.PI * 2
      arr[i * 3] = Math.cos(a) * radius
      arr[i * 3 + 2] = Math.sin(a) * radius
    }
    return arr
  }, [radius])

  return (
    <lineLoop raycast={() => null}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <lineBasicMaterial color="#8fd8ff" transparent opacity={opacity} depthWrite={false} />
    </lineLoop>
  )
}

interface PlanetProps {
  config: PlanetConfig
  /** Replaces the default textured surface (Earth, Saturn). Rendered in the spinning frame. */
  surface?: ReactNode
  /** Rendered in the tilted, non-spinning frame (rings, cloud layers that manage their own spin). */
  tilted?: ReactNode
  /** Rendered in the untilted orbit frame (moons, satellites). */
  children?: ReactNode
  /** Grow in from nothing on mount (Planet X on discovery). */
  appear?: boolean
}

/**
 * Orbit → tilt → spin hierarchy shared by every planet. Position is
 * integrated per frame (not derived from elapsed time) so the global orbit
 * speed can ease to zero and back without the planets jumping.
 */
export default function Planet({ config, surface, tilted, children, appear = false }: PlanetProps) {
  const orbit = useRef<Group>(null)
  const body = useRef<Group>(null)
  const spin = useRef<Group>(null)
  const angle = useRef(config.phase)
  const grow = useRef({ value: appear ? 0.001 : 1 })
  const interaction = useBodyInteraction(config.id, orbit, body)
  const handlers = useMemo(() => bodyPointerHandlers(config.id), [config.id])
  const fallback = useCallback(
    () => proceduralSurface(config.fallback.style, config.fallback.colors),
    [config.fallback.style, config.fallback.colors],
  )

  useFrame((_, dt) => {
    angle.current += dt * config.orbitSpeed * simulation.orbitSpeed * interaction.current.orbit
    const r = config.orbitRadius
    orbit.current?.position.set(Math.cos(angle.current) * r, 0, -Math.sin(angle.current) * r)
    if (spin.current) spin.current.rotation.y += dt * config.spinSpeed * simulation.ambient
    if (grow.current.value < 0.999) {
      easing.damp(grow.current, 'value', 1, 0.6, dt)
      orbit.current?.scale.setScalar(grow.current.value)
    }
  })

  return (
    <group
      ref={(g) => {
        orbit.current = g
        registerBody(config.id, g, config.radius)
      }}
      name={config.name}
    >
      <group ref={body}>
        <group rotation-y={config.tiltAzimuth ?? 0}>
          <group rotation-z={config.tilt}>
            <group ref={spin}>
              {surface ?? <Surface radius={config.radius} textureKey={config.texture} fallback={fallback} />}
            </group>
            {tilted}
            {config.atmosphere && <Atmosphere radius={config.radius} config={config.atmosphere} />}
          </group>
        </group>
        <HoverGlow radius={config.radius} interaction={interaction} />
      </group>
      {/* Generous invisible hit target: easier to hover/click than the visible sphere */}
      <mesh visible={false} {...handlers}>
        <sphereGeometry args={[config.hitRadius, 24, 12]} />
      </mesh>
      {children}
    </group>
  )
}
