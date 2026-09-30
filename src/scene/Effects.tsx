import { Bloom, EffectComposer, ToneMapping, Vignette } from '@react-three/postprocessing'
import { ToneMappingMode } from 'postprocessing'

/**
 * HDR post chain. The composer renders to a half-float buffer, so only
 * values above ~1 (the Sun, its corona, city lights) bloom. Tone mapping
 * happens here rather than on the renderer (the composer disables it there).
 */
export default function Effects() {
  return (
    <EffectComposer multisampling={4}>
      <Bloom mipmapBlur luminanceThreshold={1} luminanceSmoothing={0.3} intensity={1.15} radius={0.78} />
      <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
      <Vignette offset={0.28} darkness={0.62} />
    </EffectComposer>
  )
}
