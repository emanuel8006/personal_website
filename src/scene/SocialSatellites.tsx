import { useFrame, type ThreeEvent } from '@react-three/fiber'
import { easing } from 'maath'
import { useMemo, useRef, type RefObject } from 'react'
import { Color, DoubleSide, type Group, type MeshStandardMaterial } from 'three'
import { CONTACT, type SocialLink } from '../data/content'
import { useAppStore } from '../store'
import { MERCURY_SATELLITES } from './bodies'
import HoverGlow from './HoverGlow'
import { canInteract, type InteractionState } from './interaction'
import { registerSatellite, simulation } from './registry'

const CLICK_SLOP = 6
const BEACON = new Color('#5ee7ff')

function openLink(href: string) {
  if (href.startsWith('mailto:')) window.location.href = href
  else window.open(href, '_blank', 'noopener,noreferrer')
}

/** Small spacecraft: foil-wrapped bus, two solar wings, dish, and a blinking beacon. */
function SatelliteModel({ beacon }: { beacon: RefObject<MeshStandardMaterial | null> }) {
  return (
    <group>
      <mesh>
        <boxGeometry args={[0.3, 0.24, 0.24]} />
        <meshStandardMaterial color="#d9b56a" metalness={0.75} roughness={0.32} />
      </mesh>
      {[-1, 1].map((side) => (
        <group key={side} position={[side * 0.46, 0, 0]}>
          <mesh>
            <boxGeometry args={[0.56, 0.015, 0.22]} />
            <meshStandardMaterial color="#1b3570" metalness={0.4} roughness={0.25} emissive="#0c1f4d" />
          </mesh>
          <mesh position={[-side * 0.3, 0, 0]}>
            <boxGeometry args={[0.06, 0.02, 0.02]} />
            <meshStandardMaterial color="#9aa3b2" metalness={0.8} roughness={0.3} />
          </mesh>
        </group>
      ))}
      <mesh position={[0, 0.17, 0]} rotation-x={Math.PI}>
        <coneGeometry args={[0.1, 0.07, 16, 1, true]} />
        <meshStandardMaterial color="#e8ecf2" metalness={0.3} roughness={0.4} side={DoubleSide} />
      </mesh>
      <mesh position={[0, -0.14, 0.09]}>
        <sphereGeometry args={[0.028, 8, 8]} />
        <meshStandardMaterial ref={beacon} color="#000000" emissive={BEACON} emissiveIntensity={2} toneMapped={false} />
      </mesh>
    </group>
  )
}

function Satellite({ link, index, count }: { link: SocialLink; index: number; count: number }) {
  const orbit = useRef<Group>(null)
  const body = useRef<Group>(null)
  const beacon = useRef<MeshStandardMaterial>(null)
  const angle = useRef((index / count) * Math.PI * 2)
  const interaction = useRef<InteractionState>({ hover: 0, orbit: 1, dim: 1 })
  const phase = useMemo(() => index * 1.7, [index])

  useFrame(({ clock }, dt) => {
    const hovered = useAppStore.getState().hoveredSocial === link.href
    const s = interaction.current
    easing.damp(s, 'hover', hovered ? 1 : 0, 0.15, dt)
    easing.damp(s, 'orbit', hovered ? 0 : 1, 0.3, dt)

    angle.current += dt * MERCURY_SATELLITES.speed * simulation.orbitSpeed * s.orbit
    const d = MERCURY_SATELLITES.distance
    const o = orbit.current
    if (o) {
      o.position.set(Math.cos(angle.current) * d, 0, -Math.sin(angle.current) * d)
      o.rotation.y = angle.current // panels trail along the orbit
    }
    body.current?.scale.setScalar(1 + 0.45 * s.hover)

    // Beacon: short blink every ~2 s, solid while hovered
    if (beacon.current) {
      const blink = (Math.sin(clock.elapsedTime * 3 + phase) + 1) / 2 > 0.85 ? 1 : 0.15
      beacon.current.emissiveIntensity = 2.5 * Math.max(blink, s.hover)
    }
  })

  const handlers = useMemo(
    () => ({
      onPointerOver: (e: ThreeEvent<PointerEvent>) => {
        if (!canInteract()) return
        e.stopPropagation()
        useAppStore.getState().setHoveredSocial(link.href)
        document.body.style.cursor = 'pointer'
      },
      onPointerOut: () => {
        if (useAppStore.getState().hoveredSocial === link.href) useAppStore.getState().setHoveredSocial(null)
        document.body.style.cursor = ''
      },
      onClick: (e: ThreeEvent<MouseEvent>) => {
        if (!canInteract()) return
        e.stopPropagation()
        if (e.delta > CLICK_SLOP) return
        openLink(link.href)
      },
    }),
    [link.href],
  )

  return (
    <group
      ref={(g) => {
        orbit.current = g
        registerSatellite(link.href, g, 0.5)
      }}
      name={`Satellite: ${link.label}`}
    >
      <group ref={body}>
        <SatelliteModel beacon={beacon} />
        <HoverGlow radius={0.42} interaction={interaction} />
      </group>
      <mesh visible={false} {...handlers}>
        <sphereGeometry args={[0.8, 12, 8]} />
      </mesh>
    </group>
  )
}

/** One satellite per social link, on a tilted ring around Mercury. */
export default function SocialSatellites() {
  const links = CONTACT.socials
  return (
    <group rotation-x={MERCURY_SATELLITES.tilt}>
      {links.map((link, i) => (
        <Satellite key={link.href} link={link} index={i} count={links.length} />
      ))}
    </group>
  )
}
