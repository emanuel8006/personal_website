#!/usr/bin/env node
/**
 * Post-build: writes dist/third-party-licenses.txt with the license text of
 * every production dependency (the code that ships to visitors or runs in the
 * API). MIT/BSD/Apache/Zlib/OFL all ask that notices travel with copies.
 */
import { execFileSync } from 'node:child_process'
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const own = JSON.parse(readFileSync(path.join(ROOT, 'package.json'), 'utf8')).name

let out = ''
try {
  out = execFileSync('npm', ['ls', '--omit=dev', '--all', '--parseable'], { cwd: ROOT, encoding: 'utf8' })
} catch (err) {
  out = err.stdout ?? '' // npm ls exits non-zero on harmless peer warnings; the list is still printed
}

const seen = new Map()
for (const dir of out.split('\n').filter(Boolean)) {
  const pkgFile = path.join(dir, 'package.json')
  if (!existsSync(pkgFile)) continue
  const pkg = JSON.parse(readFileSync(pkgFile, 'utf8'))
  if (!pkg.name || pkg.name === own) continue
  const key = `${pkg.name}@${pkg.version}`
  if (seen.has(key)) continue
  const licenseFile = readdirSync(dir).find((f) => /^(licen[sc]e|copying|notice)(\.|$)/i.test(f))
  const text = licenseFile ? readFileSync(path.join(dir, licenseFile), 'utf8').trim() : ''
  const license = typeof pkg.license === 'string' ? pkg.license : (pkg.license?.type ?? 'see package')
  seen.set(key, { key, license, text, repo: typeof pkg.repository === 'string' ? pkg.repository : pkg.repository?.url })
}

const entries = [...seen.values()].sort((a, b) => a.key.localeCompare(b.key))
const header = `Third-party software notices\n\nThis site includes the following open-source packages (${entries.length}).\nTextures and fonts are credited in the site's Credits dialog.\n`
const body = entries
  .map((e) => `${'='.repeat(78)}\n${e.key}  (${e.license})${e.repo ? `\n${e.repo}` : ''}\n${'-'.repeat(78)}\n${e.text || `License: ${e.license}`}\n`)
  .join('\n')
writeFileSync(path.join(ROOT, 'dist', 'third-party-licenses.txt'), `${header}\n${body}`)
console.log(`✓ wrote dist/third-party-licenses.txt (${entries.length} packages)`)
