import { lazy, Suspense } from 'react'
import PlainView from './fallback/PlainView'
import { useKonami } from './hooks/useKonami'
import { useAppStore } from './store'
import FadeCut from './ui/FadeCut'
import Hud from './ui/Hud'
import IntroOverlay from './ui/IntroOverlay'
import SpaceshipCursor from './ui/SpaceshipCursor'
import Toast from './ui/Toast'

// three.js + R3F live in their own chunk so the 2D view never downloads them.
const Scene = lazy(() => import('./scene/Scene'))

export default function App() {
  const viewMode = useAppStore((s) => s.viewMode)
  const discoverPlanetX = useAppStore((s) => s.discoverPlanetX)
  useKonami(discoverPlanetX)

  return (
    <>
      {viewMode === '3d' ? (
        <main className="fixed inset-0 bg-space">
          <Suspense fallback={null}>
            <Scene />
          </Suspense>
          <Hud />
          <FadeCut />
          <IntroOverlay />
        </main>
      ) : (
        <PlainView />
      )}
      <Toast />
      <SpaceshipCursor />
    </>
  )
}
