import { useProgress } from '@react-three/drei'
import { useEffect } from 'react'
import { useAppStore } from '../store'

/** Quiet period after the last loader finishes before we call the scene ready. */
const SETTLE_MS = 250
/** Never hold the page hostage: reveal anyway after this long. */
const MAX_WAIT_MS = 20000

/**
 * Mirrors drei's real loading progress into the store (for the DOM loader)
 * and signals `sceneReady` once nothing has been loading for a moment.
 * Mounted inside the scene's top Suspense boundary, alongside <Preload all />
 * so shaders are compiled before the reveal.
 *
 * drei's progress store updates synchronously when a loader starts, which can
 * happen in the middle of another component's render, so updates are
 * forwarded on a microtask instead of through a hook subscription.
 */
export default function LoadingReporter() {
  useEffect(() => {
    const { setLoadProgress, sceneReady } = useAppStore.getState()
    let settle = 0

    const onProgress = ({ progress, active }: { progress: number; active: boolean }) => {
      queueMicrotask(() => {
        setLoadProgress(progress)
        window.clearTimeout(settle)
        if (!active) settle = window.setTimeout(sceneReady, SETTLE_MS)
      })
    }

    onProgress(useProgress.getState())
    const unsubscribe = useProgress.subscribe(onProgress)
    const maxWait = window.setTimeout(sceneReady, MAX_WAIT_MS)

    return () => {
      unsubscribe()
      window.clearTimeout(settle)
      window.clearTimeout(maxWait)
    }
  }, [])

  return null
}
