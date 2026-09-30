import manifest from '../generated/texture-manifest.json'

/**
 * Texture URLs by id. The manifest is written by `npm run textures`
 * (scripts/optimize-textures.mjs) and only lists files that actually exist,
 * so a missing key means "use the procedural fallback".
 *
 * Resolution is set per texture in scripts/optimize-textures.mjs.
 */
export type TextureKey =
  | 'sun'
  | 'mercury'
  | 'earthDay'
  | 'earthNight'
  | 'earthClouds'
  | 'earthNormal'
  | 'earthSpecular'
  | 'moon'
  | 'mars'
  | 'jupiter'
  | 'saturn'
  | 'saturnRing'
  | 'starsMilkyWay'
  | 'planetX'

const TEXTURES: Partial<Record<TextureKey, string>> = manifest

export function textureUrl(key: TextureKey): string | undefined {
  return TEXTURES[key]
}
