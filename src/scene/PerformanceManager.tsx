import { PerformanceMonitor } from '@react-three/drei'
import { useThree } from '@react-three/fiber'
import { useEffect, useRef, useState } from 'react'
import { TIER_SETTINGS } from '../lib/capability'
import { useAppStore } from '../store'

/** Ignore the first moments after the intro (shader warm-up, texture uploads). */
const GRACE_MS = 2500
/** Declines while already on the lowest tier before giving up on 3D. */
const STRIKES_TO_2D = 2

/**
 * Applies the current quality tier's DPR and adapts the tier to the measured
 * frame rate: steps down on sustained drops, back up when there's headroom,
 * caps the tier if it keeps flip-flopping, and falls back to the 2D view if
 * even the lowest tier can't hold a usable frame rate.
 */
export default function PerformanceManager() {
  const quality = useAppStore((s) => s.quality)
  const introDone = useAppStore((s) => s.intro === 'done')
  const setDpr = useThree((s) => s.setDpr)
  const [monitoring, setMonitoring] = useState(false)
  const strikes = useRef(0)

  useEffect(() => {
    setDpr(TIER_SETTINGS[quality].dpr)
  }, [quality, setDpr])

  useEffect(() => {
    if (!introDone) return
    const timer = window.setTimeout(() => setMonitoring(true), GRACE_MS)
    return () => window.clearTimeout(timer)
  }, [introDone])

  if (!monitoring) return null
  return (
    <PerformanceMonitor
      flipflops={3}
      onDecline={() => {
        const s = useAppStore.getState()
        if (s.quality !== 'low') return s.degradeQuality()
        strikes.current += 1
        if (strikes.current >= STRIKES_TO_2D) s.fallbackTo2D('low-fps')
      }}
      onIncline={() => {
        strikes.current = 0
        useAppStore.getState().improveQuality()
      }}
      onFallback={() => useAppStore.getState().lockQuality()}
    />
  )
}
