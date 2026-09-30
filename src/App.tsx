import { lazy, Suspense } from 'react'
import PlainView from './fallback/PlainView'
import { useKonami } from './hooks/useKonami'
import { useAppStore } from './store'
import SpaceshipCursor from './ui/SpaceshipCursor'
import Toast from './ui/Toast'

// The 3D experience (HUD, panel, intro, scene) is split out: 2D visitors never download it.
const ThreeDView = lazy(() => import('./ThreeDView'))

export default function App() {
  const viewMode = useAppStore((s) => s.viewMode)
  const discoverPlanetX = useAppStore((s) => s.discoverPlanetX)
  useKonami(discoverPlanetX)

  return (
    <>
      {viewMode === '3d' ? (
        <Suspense fallback={<div className="fixed inset-0 bg-black" />}>
          <ThreeDView />
        </Suspense>
      ) : (
        <PlainView />
      )}
      <Toast />
      <SpaceshipCursor />
    </>
  )
}
