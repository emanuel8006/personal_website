import { Stars, useTexture } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import { BackSide, SRGBColorSpace, type Group } from 'three'
import Nebula from './Nebula'
import { textureUrl } from './textures'

const BACKDROP_RADIUS = 1000

function MilkyWay({ url }: { url: string }) {
  const map = useTexture(url, (t) => {
    t.colorSpace = SRGBColorSpace
  })
  return (
    // scale.x = -1 un-mirrors the equirect when viewed from inside (BackSide)
    <mesh scale={[-1, 1, 1]} renderOrder={-2}>
      <sphereGeometry args={[BACKDROP_RADIUS, 64, 32]} />
      <meshBasicMaterial map={map} side={BackSide} color="#c4c9e4" depthWrite={false} toneMapped={false} />
    </mesh>
  )
}

/**
 * Deep background: the Milky Way sphere + nebula follow the camera (so they
 * read as infinitely far away), while the drei Stars stay fixed in world
 * space and provide parallax when the camera moves.
 */
export default function Starfield() {
  const backdrop = useRef<Group>(null)
  const milkyWay = textureUrl('starsMilkyWay')

  useFrame(({ camera }) => {
    backdrop.current?.position.copy(camera.position)
  })

  return (
    <>
      <group ref={backdrop}>
        {milkyWay && <MilkyWay url={milkyWay} />}
        <Nebula radius={BACKDROP_RADIUS * 0.95} />
      </group>
      <Stars radius={380} depth={120} count={7000} factor={5} saturation={0.15} fade speed={0.4} />
    </>
  )
}
