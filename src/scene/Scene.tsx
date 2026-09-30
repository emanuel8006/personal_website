import { Canvas } from '@react-three/fiber'
import { Suspense } from 'react'
import CameraRig from './CameraRig'
import { OVERVIEW_POSITION } from './constants'
import Starfield from './Starfield'

export default function Scene() {
  return (
    <Canvas
      dpr={[1, 2]}
      camera={{ fov: 45, near: 0.1, far: 4000, position: OVERVIEW_POSITION }}
      gl={{ antialias: true, powerPreference: 'high-performance' }}
      aria-hidden="true"
    >
      <color attach="background" args={['#05060f']} />
      <Suspense fallback={null}>
        <Starfield />
      </Suspense>
      <CameraRig />
    </Canvas>
  )
}
