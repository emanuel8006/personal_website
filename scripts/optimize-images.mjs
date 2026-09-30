#!/usr/bin/env node
/**
 * Resizes photos/screenshots into responsive WebP files for the panel.
 *
 *   npm run images
 *
 * Add an entry to IMAGES for each new image, then reference the outputs from
 * src/data/content.ts (see `photo` / project `media`).
 */
import { stat } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

/** src: original (any format) · out: output basename in public/images/ · widths: px */
const IMAGES = [{ src: 'public/images/Portrait.jpg', out: 'portrait', widths: [480, 960] }]

const fmt = (b) => `${(b / 1024).toFixed(0)} KB`

for (const { src, out, widths } of IMAGES) {
  const input = path.join(ROOT, src)
  for (const width of widths) {
    const file = path.join(ROOT, 'public', 'images', `${out}-${width}.webp`)
    const info = await sharp(input)
      .rotate() // respect EXIF orientation
      .resize({ width, withoutEnlargement: true })
      .webp({ quality: 82 })
      .toFile(file)
    console.log(`✓ ${path.relative(ROOT, file).padEnd(36)} ${info.width}×${info.height}  ${fmt((await stat(file)).size)}`)
  }
}
