import { Preload } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import { Suspense } from 'react'
import { TIER_SETTINGS } from '../lib/capability'
import { useAppStore } from '../store'
import AsteroidBelt from './AsteroidBelt'
import CameraRig from './CameraRig'
import DevHandle from './DevHandle'
import { OVERVIEW_POSITION } from './constants'
import Effects from './Effects'
import HoverTracker from './HoverTracker'
import LoadingReporter from './LoadingReporter'
import PerformanceManager from './PerformanceManager'
import ShootingStars from './ShootingStars'
import SolarSystem from './SolarSystem'
import Starfield from './Starfield'

export default function Scene() {
  // Initial tier only; PerformanceManager updates DPR at runtime
  const initialDpr = TIER_SETTINGS[useAppStore.getState().quality].dpr

  return (
    <Canvas
      dpr={initialDpr}
      camera={{ fov: 45, near: 0.1, far: 4000, position: OVERVIEW_POSITION }}
      // MSAA happens in the EffectComposer; canvas-level AA would be wasted work
      gl={{ antialias: false, powerPreference: 'high-performance' }}
      aria-hidden="true"
      onCreated={({ gl }) => {
        // If the GPU drops the context (driver reset, memory pressure), fall back to 2D
        gl.domElement.addEventListener('webglcontextlost', (e) => {
          e.preventDefault()
          useAppStore.getState().fallbackTo2D('context-lost')
        })
      }}
    >
      <color attach="background" args={['#05060f']} />
      <Suspense fallback={null}>
        <Starfield />
        <ShootingStars />
        <SolarSystem />
        <AsteroidBelt />
        {/* Compile shaders + upload textures before the reveal, then report ready */}
        <Preload all />
        <LoadingReporter />
      </Suspense>
      <CameraRig />
      <HoverTracker />
      {import.meta.env.DEV && <DevHandle />}
      <Effects />
      <PerformanceManager />
    </Canvas>
  )
}
