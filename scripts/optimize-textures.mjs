#!/usr/bin/env node
/**
 * Converts raw texture downloads in /source-textures/ (gitignored) into
 * optimized web files in /public/textures/, and writes a manifest the app
 * uses to decide which bodies get real textures vs. procedural fallbacks.
 *
 *   npm run textures
 *
 * Source files are matched by keyword, so Solar System Scope names like
 * `8k_earth_daymap.jpg` or `2k_earth_daymap.jpg` both work. When several
 * files match, the highest-resolution one wins. Images are never upscaled.
 *
 * To change a body's shipped resolution, edit `width` below and re-run.
 */
import { mkdir, readdir, rm, stat, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const SRC_DIR = path.join(ROOT, 'source-textures')
const OUT_DIR = path.join(ROOT, 'public', 'textures')
const MANIFEST = path.join(ROOT, 'src', 'generated', 'texture-manifest.json')

const K2 = 2048
const K4 = 4096

/**
 * key:    id the app looks up (see src/scene/textures.ts)
 * out:    output filename in public/textures/
 * match:  regex tested against source filenames (lowercased)
 * width:  max output width in px (height follows the source aspect ratio)
 * format: 'webp' (default) or 'png'
 * data:   true for non-color maps (normal, specular): higher quality, no color tweaks
 */
const TARGETS = [
  { key: 'sun', out: 'sun.webp', match: /(^|_)sun\b/, width: K4 },
  { key: 'mercury', out: 'mercury.webp', match: /mercury/, width: K2 },
  { key: 'earthDay', out: 'earth_day.webp', match: /earth_daymap/, width: K4 },
  { key: 'earthNight', out: 'earth_night.webp', match: /earth_nightmap/, width: K2 },
  { key: 'earthClouds', out: 'earth_clouds.webp', match: /earth_clouds/, width: K2, grayscale: true },
  { key: 'earthNormal', out: 'earth_normal.webp', match: /earth_normal/, width: K2, data: true },
  { key: 'earthSpecular', out: 'earth_specular.webp', match: /earth_specular/, width: K2, data: true, grayscale: true },
  { key: 'moon', out: 'moon.webp', match: /moon/, width: K2 },
  { key: 'mars', out: 'mars.webp', match: /mars/, width: K2 },
  { key: 'jupiter', out: 'jupiter.webp', match: /jupiter/, width: K2 },
  { key: 'saturn', out: 'saturn.webp', match: /saturn(?!_ring)/, width: K2 },
  { key: 'saturnRing', out: 'saturn_ring.png', match: /saturn_ring/, width: K2, format: 'png' },
  { key: 'starsMilkyWay', out: 'stars_milkyway.webp', match: /stars_milky_way|milky_way/, width: K4 },
  { key: 'planetX', out: 'planet_x.webp', match: /neptune|uranus|pluto|planet_x/, width: K2 },
]

const IMAGE_EXT = /\.(jpe?g|png|tiff?|webp)$/i

async function listSources() {
  try {
    const names = await readdir(SRC_DIR)
    return names.filter((n) => IMAGE_EXT.test(n))
  } catch {
    console.error(`No ${path.relative(ROOT, SRC_DIR)}/ folder found. Create it and add the raw downloads.`)
    process.exit(1)
  }
}

/** Among matching files, pick the one with the largest pixel width. */
async function pickSource(candidates) {
  let best = null
  for (const name of candidates) {
    const meta = await sharp(path.join(SRC_DIR, name)).metadata()
    if (!best || (meta.width ?? 0) > best.width) best = { name, width: meta.width ?? 0 }
  }
  return best
}

async function build(target, sourceName) {
  const outPath = path.join(OUT_DIR, target.out)
  let img = sharp(path.join(SRC_DIR, sourceName), { limitInputPixels: false })
    .resize({ width: target.width, withoutEnlargement: true })

  if (target.grayscale) img = img.grayscale()

  if (target.format === 'png') {
    img = img.png({ compressionLevel: 9, palette: false })
  } else {
    img = img.webp(target.data ? { quality: 92, smartSubsample: false } : { quality: 85, smartSubsample: true })
  }

  const info = await img.toFile(outPath)
  const { size } = await stat(outPath)
  return { width: info.width, height: info.height, size }
}

const fmt = (bytes) => `${(bytes / 1024 / 1024).toFixed(2)} MB`

async function main() {
  const sources = await listSources()
  await mkdir(OUT_DIR, { recursive: true })
  await mkdir(path.dirname(MANIFEST), { recursive: true })

  const manifest = {}
  const missing = []
  let total = 0

  for (const target of TARGETS) {
    const candidates = sources.filter((n) => target.match.test(n.toLowerCase()))
    const outPath = path.join(OUT_DIR, target.out)

    if (candidates.length === 0) {
      missing.push(target)
      await rm(outPath, { force: true }) // don't ship stale output for a removed source
      continue
    }

    const src = await pickSource(candidates)
    const result = await build(target, src.name)
    total += result.size
    manifest[target.key] = `/textures/${target.out}`

    const note = result.width < target.width ? `  (source is only ${src.width}px, target ${target.width}px)` : ''
    console.log(
      `✓ ${target.out.padEnd(22)} ← ${src.name.padEnd(28)} ${`${result.width}×${result.height}`.padEnd(10)} ${fmt(result.size)}${note}`,
    )
  }

  await writeFile(MANIFEST, JSON.stringify(manifest, null, 2) + '\n')

  console.log(`\nTotal texture payload: ${fmt(total)}`)
  if (missing.length) {
    console.log(`\nMissing sources (procedural fallback will be used):`)
    for (const t of missing) console.log(`  - ${t.out}  (looking for ${t.match})`)
  }
  console.log(`\nManifest written to ${path.relative(ROOT, MANIFEST)}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
