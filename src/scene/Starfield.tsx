import { Stars, useTexture } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { easing } from 'maath'
import { useRef } from 'react'
import { BackSide, Color, SRGBColorSpace, type Group, type MeshBasicMaterial } from 'three'
import { TIER_SETTINGS } from '../lib/capability'
import { useAppStore } from '../store'
import Nebula from './Nebula'
import { reveal } from './registry'
import { textureUrl } from './textures'

const BACKDROP_RADIUS = 1000
const MILKY_WAY_TINT = new Color('#c4c9e4')

function MilkyWay({ url }: { url: string }) {
  const map = useTexture(url, (t) => {
    t.colorSpace = SRGBColorSpace
  })
  const material = useRef<MeshBasicMaterial>(null)
  useFrame(() => material.current?.color.copy(MILKY_WAY_TINT).multiplyScalar(reveal.value))
  return (
    // scale.x = -1 un-mirrors the equirect when viewed from inside (BackSide)
    <mesh scale={[-1, 1, 1]} renderOrder={-2}>
      <sphereGeometry args={[BACKDROP_RADIUS, 64, 32]} />
      <meshBasicMaterial
        ref={material}
        map={map}
        side={BackSide}
        color={MILKY_WAY_TINT}
        depthWrite={false}
        toneMapped={false}
      />
    </mesh>
  )
}

/**
 * Deep background: the Milky Way sphere + nebula follow the camera (so they
 * read as infinitely far away), while the drei Stars stay fixed in world
 * space and provide parallax when the camera moves.
 */
export default function Starfield() {
  const stars = useAppStore((s) => TIER_SETTINGS[s.quality].stars)
  const backdrop = useRef<Group>(null)
  const milkyWay = textureUrl('starsMilkyWay')

  const primed = useRef(false)

  useFrame(({ camera }, dt) => {
    backdrop.current?.position.copy(camera.position)

    // Full intro: backdrop starts dark and brightens once the intro begins
    const { intro, introMode } = useAppStore.getState()
    if (!primed.current) {
      primed.current = true
      if (intro === 'loading' && introMode === 'full') reveal.value = 0
    }
    easing.damp(reveal, 'value', intro === 'loading' && introMode === 'full' ? 0 : 1, 1.1, dt)
  })

  return (
    <>
      <group ref={backdrop}>
        {milkyWay && <MilkyWay url={milkyWay} />}
        <Nebula radius={BACKDROP_RADIUS * 0.95} />
      </group>
      <Stars radius={380} depth={120} count={stars} factor={5} saturation={0.15} fade speed={0.4} />
    </>
  )
}
