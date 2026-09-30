import { Canvas } from '@react-three/fiber'
import { Suspense } from 'react'
import CameraRig from './CameraRig'
import DevHandle from './DevHandle'
import { OVERVIEW_POSITION } from './constants'
import Effects from './Effects'
import HoverTracker from './HoverTracker'
import SolarSystem from './SolarSystem'
import Starfield from './Starfield'

export default function Scene() {
  return (
    <Canvas
      dpr={[1, 2]}
      camera={{ fov: 45, near: 0.1, far: 4000, position: OVERVIEW_POSITION }}
      // MSAA happens in the EffectComposer; canvas-level AA would be wasted work
      gl={{ antialias: false, powerPreference: 'high-performance' }}
      aria-hidden="true"
    >
      <color attach="background" args={['#05060f']} />
      <Suspense fallback={null}>
        <Starfield />
        <SolarSystem />
      </Suspense>
      <CameraRig />
      <HoverTracker />
      {import.meta.env.DEV && <DevHandle />}
      <Effects />
    </Canvas>
  )
}
