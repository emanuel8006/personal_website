import type { QualityTier, ViewMode } from '../store'

/**
 * Decides, once at startup, whether this device gets the 3D scene or the fast
 * 2D view, and which quality tier the 3D scene starts at. The in-scene
 * PerformanceMonitor refines the tier (and can fall back to 2D) at runtime.
 */

export type FallbackReason =
  'no-webgl' | 'small-screen' | 'reduced-data' | 'low-end' | 'software-gpu' | 'low-fps' | 'context-lost' | 'user'

export interface Capability {
  /** Best view for this device. */
  view: ViewMode
  /** Why 2D was chosen (when view === '2d'). */
  reason?: FallbackReason
  /** Highest tier this device should run in 3D. */
  maxTier: QualityTier
  /** 3D is technically possible here (WebGL2 works, screen is large enough). */
  can3D: boolean
}

const mq = (query: string) => typeof window !== 'undefined' && window.matchMedia(query).matches

function probeWebGL(): { ok: boolean; renderer: string } {
  try {
    const canvas = document.createElement('canvas')
    const gl = canvas.getContext('webgl2')
    if (!gl) return { ok: false, renderer: '' }
    const info = gl.getExtension('WEBGL_debug_renderer_info')
    const renderer = info ? String(gl.getParameter(info.UNMASKED_RENDERER_WEBGL)) : ''
    gl.getExtension('WEBGL_lose_context')?.loseContext() // free the probe context right away
    return { ok: true, renderer }
  } catch {
    return { ok: false, renderer: '' }
  }
}

export function detectCapability(): Capability {
  const { ok, renderer } = probeWebGL()
  const r = renderer.toLowerCase()
  const software = /swiftshader|llvmpipe|softpipe|software|basic render/.test(r)
  const smallScreen = window.innerWidth < 768 || (mq('(pointer: coarse)') && !mq('(pointer: fine)'))
  const can3D = ok && !smallScreen

  const cores = navigator.hardwareConcurrency ?? 8
  const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 8

  const twoD = (reason: FallbackReason): Capability => ({ view: '2d', reason, maxTier: 'low', can3D })

  if (!ok) return twoD('no-webgl')
  if (smallScreen) return twoD('small-screen')
  if (mq('(prefers-reduced-data: reduce)')) return twoD('reduced-data')
  if (cores <= 2 || memory <= 2) return twoD('low-end')
  if (software) return twoD('software-gpu')

  let maxTier: QualityTier = 'high'
  if (cores <= 4 || memory <= 4) maxTier = 'low'
  else if (/intel|mali|adreno|powervr/.test(r) && !/arc/.test(r)) maxTier = 'medium' // integrated GPUs
  return { view: '3d', maxTier, can3D }
}

/** Per-tier render settings, in one place. */
export const TIER_SETTINGS: Record<
  QualityTier,
  { dpr: [number, number]; post: boolean; multisampling: number; asteroids: number; stars: number }
> = {
  high: { dpr: [1, 2], post: true, multisampling: 4, asteroids: 1600, stars: 7000 },
  medium: { dpr: [1, 1.5], post: true, multisampling: 2, asteroids: 900, stars: 4500 },
  low: { dpr: [1, 1], post: false, multisampling: 0, asteroids: 400, stars: 2500 },
}

export const TIER_ORDER: QualityTier[] = ['low', 'medium', 'high']
