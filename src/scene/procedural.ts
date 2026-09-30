import { CanvasTexture, Color, SRGBColorSpace } from 'three'

/**
 * CPU-generated equirectangular fallbacks for bodies whose texture file is
 * missing. Noise is sampled on the unit sphere, so the maps wrap seamlessly.
 * Small (512×256) and cached: only generated when actually needed.
 */

const W = 512
const H = 256

function hash(x: number, y: number, z: number, seed: number) {
  let h = (Math.imul(x, 374761393) + Math.imul(y, 668265263) + Math.imul(z, 1440662683) + Math.imul(seed, 1274126177)) | 0
  h = Math.imul(h ^ (h >>> 13), 1274126177)
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295
}

function valueNoise(x: number, y: number, z: number, seed: number) {
  const xi = Math.floor(x)
  const yi = Math.floor(y)
  const zi = Math.floor(z)
  const s = (t: number) => t * t * (3 - 2 * t)
  const u = s(x - xi)
  const v = s(y - yi)
  const w = s(z - zi)
  const lerp = (a: number, b: number, t: number) => a + (b - a) * t
  const c = (dx: number, dy: number, dz: number) => hash(xi + dx, yi + dy, zi + dz, seed)
  return lerp(
    lerp(lerp(c(0, 0, 0), c(1, 0, 0), u), lerp(c(0, 1, 0), c(1, 1, 0), u), v),
    lerp(lerp(c(0, 0, 1), c(1, 0, 1), u), lerp(c(0, 1, 1), c(1, 1, 1), u), v),
    w,
  )
}

function fbm(x: number, y: number, z: number, seed: number, octaves = 5) {
  let sum = 0
  let amp = 0.5
  let norm = 0
  for (let i = 0; i < octaves; i++) {
    sum += amp * valueNoise(x, y, z, seed + i)
    norm += amp
    x *= 2.02
    y *= 2.02
    z *= 2.02
    amp *= 0.5
  }
  return sum / norm
}

function paint(fn: (dir: [number, number, number], lat: number) => [number, number, number, number]) {
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')!
  const img = ctx.createImageData(W, H)
  for (let py = 0; py < H; py++) {
    const lat = (0.5 - (py + 0.5) / H) * Math.PI
    for (let px = 0; px < W; px++) {
      const lon = ((px + 0.5) / W) * Math.PI * 2
      const dir: [number, number, number] = [Math.cos(lat) * Math.cos(lon), Math.sin(lat), Math.cos(lat) * Math.sin(lon)]
      const [r, g, b, a] = fn(dir, lat)
      const i = (py * W + px) * 4
      img.data[i] = r
      img.data[i + 1] = g
      img.data[i + 2] = b
      img.data[i + 3] = a
    }
  }
  ctx.putImageData(img, 0, 0)
  return canvas
}

const toRgb = (hex: string) => {
  const c = new Color(hex)
  return [c.r * 255, c.g * 255, c.b * 255] as const
}

function mixColors(colors: (readonly [number, number, number])[], t: number): [number, number, number] {
  const x = Math.min(Math.max(t, 0), 0.9999) * (colors.length - 1)
  const i = Math.floor(x)
  const f = x - i
  const a = colors[i]
  const b = colors[i + 1]
  return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f]
}

const cache = new Map<string, CanvasTexture>()

function cached(key: string, build: () => HTMLCanvasElement, srgb = true) {
  let tex = cache.get(key)
  if (!tex) {
    tex = new CanvasTexture(build())
    if (srgb) tex.colorSpace = SRGBColorSpace
    cache.set(key, tex)
  }
  return tex
}

/** Cratered/mottled rocky surface or banded gas giant, from a small palette. */
export function proceduralSurface(style: 'rocky' | 'banded', colors: string[], seed = 1) {
  const palette = colors.map(toRgb)
  return cached(`${style}:${colors.join()}:${seed}`, () =>
    paint(([x, y, z], lat) => {
      if (style === 'banded') {
        const turbulence = fbm(x * 3, y * 3, z * 3, seed) - 0.5
        const band = 0.5 + 0.5 * Math.sin(lat * 14 + turbulence * 3.5)
        const [r, g, b] = mixColors(palette, band)
        return [r, g, b, 255]
      }
      const n = fbm(x * 2.5, y * 2.5, z * 2.5, seed)
      const detail = fbm(x * 12, y * 12, z * 12, seed + 7)
      const [r, g, b] = mixColors(palette, n * 0.8 + detail * 0.35)
      return [r, g, b, 255]
    }),
  )
}

/** Grayscale cloud coverage for use as an alphaMap. */
export function proceduralClouds(seed = 3) {
  return cached(
    `clouds:${seed}`,
    () =>
      paint(([x, y, z]) => {
        const n = fbm(x * 3, y * 6, z * 3, seed, 6)
        const v = Math.min(Math.max((n - 0.56) * 3, 0), 1) * 255
        return [v, v, v, 255]
      }),
    false,
  )
}

/** Soft radial gradient used by the Sun's corona sprites. */
export function radialGlow() {
  let tex = cache.get('glow')
  if (!tex) {
    const size = 256
    const canvas = document.createElement('canvas')
    canvas.width = canvas.height = size
    const ctx = canvas.getContext('2d')!
    const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
    g.addColorStop(0, 'rgba(255,255,255,1)')
    g.addColorStop(0.2, 'rgba(255,255,255,0.55)')
    g.addColorStop(0.45, 'rgba(255,255,255,0.16)')
    g.addColorStop(0.75, 'rgba(255,255,255,0.04)')
    g.addColorStop(1, 'rgba(255,255,255,0)')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, size, size)
    tex = new CanvasTexture(canvas)
    cache.set('glow', tex)
  }
  return tex
}

/** Faint radial streamers for the outer corona. */
export function coronaRays(seed = 11) {
  let tex = cache.get('rays')
  if (!tex) {
    const size = 512
    const canvas = document.createElement('canvas')
    canvas.width = canvas.height = size
    const ctx = canvas.getContext('2d')!
    const img = ctx.createImageData(size, size)
    for (let py = 0; py < size; py++) {
      for (let px = 0; px < size; px++) {
        const dx = (px + 0.5) / size - 0.5
        const dy = (py + 0.5) / size - 0.5
        const r = Math.sqrt(dx * dx + dy * dy) * 2
        const a = Math.atan2(dy, dx)
        // angular noise sampled on a circle so it wraps at ±π
        const streak = fbm(Math.cos(a) * 6, Math.sin(a) * 6, r * 1.5, seed, 4)
        const falloff = Math.max(0, 1 - r) ** 2.2 * Math.min(1, Math.max(0, (r - 0.18) * 4))
        const v = Math.max(0, streak - 0.35) * 1.8 * falloff * 255
        const i = (py * size + px) * 4
        img.data[i] = img.data[i + 1] = img.data[i + 2] = 255
        img.data[i + 3] = Math.min(255, v)
      }
    }
    ctx.putImageData(img, 0, 0)
    tex = new CanvasTexture(canvas)
    cache.set('rays', tex)
  }
  return tex
}

/** Concentric ring bands (radial strip, x = inner → outer) with alpha gaps. */
export function proceduralRing(seed = 5) {
  let tex = cache.get('ring')
  if (!tex) {
    const w = 1024
    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = 1
    const ctx = canvas.getContext('2d')!
    const img = ctx.createImageData(w, 1)
    for (let x = 0; x < w; x++) {
      const t = x / w
      const fine = fbm(t * 60, 0.5, 0.5, seed, 4)
      const coarse = fbm(t * 8, 1.5, 0.5, seed + 3, 3)
      const gap = t > 0.62 && t < 0.67 ? 0.1 : 1 // Cassini-like division
      const edge = Math.min(1, t * 12) * Math.min(1, (1 - t) * 8)
      const a = Math.min(1, fine * 0.9 + coarse * 0.5) * gap * edge
      const i = x * 4
      img.data[i] = 200 + coarse * 40
      img.data[i + 1] = 180 + coarse * 35
      img.data[i + 2] = 140 + coarse * 30
      img.data[i + 3] = a * 255
    }
    ctx.putImageData(img, 0, 0)
    tex = new CanvasTexture(canvas)
    tex.colorSpace = SRGBColorSpace
    cache.set('ring', tex)
  }
  return tex
}
