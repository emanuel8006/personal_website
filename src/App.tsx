import { lazy, Suspense } from 'react'
import Hud from './ui/Hud'
import IntroOverlay from './ui/IntroOverlay'
import SpaceshipCursor from './ui/SpaceshipCursor'
import Toast from './ui/Toast'

// three.js + R3F live in their own chunk so the 2D view never downloads them.
const Scene = lazy(() => import('./scene/Scene'))

export default function App() {
  return (
    <main className="fixed inset-0 bg-space">
      <Suspense fallback={null}>
        <Scene />
      </Suspense>
      <Hud />
      <IntroOverlay />
      <Toast />
      <SpaceshipCursor />
    </main>
  )
}
