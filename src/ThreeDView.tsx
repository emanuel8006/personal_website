import { lazy, Suspense } from 'react'
import FadeCut from './ui/FadeCut'
import Hud from './ui/Hud'
import IntroOverlay from './ui/IntroOverlay'

// three.js + R3F: a further chunk, so the loader UI appears before it finishes downloading
const Scene = lazy(() => import('./scene/Scene'))

/** Everything specific to the 3D experience. Loaded lazily, so the 2D view never downloads it. */
export default function ThreeDView() {
  return (
    <main className="fixed inset-0 bg-space">
      <Suspense fallback={null}>
        <Scene />
      </Suspense>
      <Hud />
      <FadeCut />
      <IntroOverlay />
    </main>
  )
}
