import { useTexture } from '@react-three/drei'
import { useThree } from '@react-three/fiber'
import { useLayoutEffect } from 'react'
import { NoColorSpace, SRGBColorSpace, type Texture } from 'three'
import { textureUrl, type TextureKey } from './textures'

/** Maps that hold data (not color) must stay linear. */
const LINEAR_SLOTS = new Set(['normalMap', 'roughnessMap', 'alphaMap', 'specularMap'])

/**
 * Loads only the textures that exist in the manifest (the set is fixed at
 * build time, so the hook call shape never changes between renders).
 * Suspends until loaded, so drei's useProgress sees the real progress.
 * Loaded textures are cached by URL, so re-renders don't refetch.
 */
export function useBodyTextures<S extends string>(slots: Record<S, TextureKey>): Partial<Record<S, Texture>> {
  const urls: Record<string, string> = {}
  for (const [slot, key] of Object.entries(slots) as [S, TextureKey][]) {
    const url = textureUrl(key)
    if (url) urls[slot] = url
  }

  // useTexture with an empty object is a no-op, so this is safe when nothing exists
  const textures = useTexture(urls) as Record<string, Texture>
  const anisotropy = useThree((s) => Math.min(8, s.gl.capabilities.getMaxAnisotropy()))

  // Runs before drei's initTexture effect, so the GPU upload uses these settings.
  // Only flags an update when something actually changed.
  useLayoutEffect(() => {
    for (const [slot, tex] of Object.entries(textures)) {
      const colorSpace = LINEAR_SLOTS.has(slot) ? NoColorSpace : SRGBColorSpace
      if (tex.colorSpace !== colorSpace || tex.anisotropy !== anisotropy) {
        tex.colorSpace = colorSpace
        tex.anisotropy = anisotropy
        tex.needsUpdate = true
      }
    }
  }, [textures, anisotropy])

  return textures as Partial<Record<S, Texture>>
}
