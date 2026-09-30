import { useFrame } from '@react-three/fiber'
import { Bloom, ChromaticAberration, EffectComposer, ToneMapping, Vignette } from '@react-three/postprocessing'
import { ToneMappingMode, type ChromaticAberrationEffect } from 'postprocessing'
import { useRef } from 'react'
import { Vector2 } from 'three'
import { prefersReducedMotion } from '../hooks/useReducedMotion'
import { TIER_SETTINGS } from '../lib/capability'
import { useAppStore } from '../store'
import { flight } from './registry'

/** Peak chromatic-aberration offset, reached mid-flight. Subtle on purpose. */
const CA_PEAK = 0.0018
const CA_INITIAL = new Vector2(0, 0)

/**
 * HDR post chain. The composer renders to a half-float buffer, so only
 * values above ~1 (the Sun, its corona, city lights) bloom. Tone mapping
 * happens here rather than on the renderer (the composer disables it there).
 */
export default function Effects() {
  const quality = useAppStore((s) => s.quality)
  const tier = TIER_SETTINGS[quality]
  const ca = useRef<ChromaticAberrationEffect>(null)

  // Chromatic aberration swells and fades with camera flights only
  useFrame(() => {
    if (!ca.current) return
    const amount = flight.active && !prefersReducedMotion() ? Math.sin(Math.PI * flight.progress) * CA_PEAK : 0
    ca.current.offset.set(amount, amount * 0.6)
  })

  // Low tier: no post chain at all (the renderer's own ACES tone mapping takes over)
  if (!tier.post) return null

  return (
    <EffectComposer multisampling={tier.multisampling}>
      <Bloom mipmapBlur luminanceThreshold={1} luminanceSmoothing={0.3} intensity={1.15} radius={0.78} />
      <ChromaticAberration ref={ca} offset={CA_INITIAL} radialModulation modulationOffset={0.25} />
      <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
      <Vignette offset={0.28} darkness={0.62} />
    </EffectComposer>
  )
}
