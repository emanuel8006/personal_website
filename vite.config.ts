import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { readFileSync } from 'node:fs'
import { defineConfig } from 'vite'
import { devApi } from './scripts/vite-dev-api.ts'
import { siteMeta } from './scripts/vite-site-meta.ts'

/** Site-wide headers from vercel.json, so `vite preview` behaves like production (CSP included). */
const vercelHeaders: Record<string, string> = Object.fromEntries(
  (
    JSON.parse(readFileSync(new URL('./vercel.json', import.meta.url), 'utf8')) as {
      headers: { source: string; headers: { key: string; value: string }[] }[]
    }
  ).headers
    .filter((h) => h.source === '/(.*)')
    .flatMap((h) => h.headers.map((x) => [x.key, x.value] as const))
    // HSTS and upgrade-insecure-requests would break plain-http localhost
    .filter(([key]) => key !== 'Strict-Transport-Security')
    .map(([key, value]) => [key, value.replace('; upgrade-insecure-requests', '')]),
)

// https://vite.dev/config/
export default defineConfig({
  preview: { headers: vercelHeaders },
  plugins: [react(), tailwindcss(), devApi(), siteMeta()],
  build: {
    // Never inline fonts as data: URLs (the CSP only allows same-origin font files)
    assetsInlineLimit: (file) => (file.endsWith('.woff2') || file.endsWith('.woff') ? false : undefined),
    // three.js core is ~700 kB minified on its own and can't be split further.
    // It only loads with the lazy 3D scene (never in the 2D view), so the
    // default 500 kB warning is noise for that one chunk.
    chunkSizeWarningLimit: 800,
    rolldownOptions: {
      output: {
        codeSplitting: {
          // Otherwise a group also swallows its deps (react, scheduler), which
          // would drag the 3D vendor chunks into the entry's preload list.
          includeDependenciesRecursively: false,
          groups: [
            // Separate vendor chunks cache independently of app code changes.
            { name: 'three', test: /node_modules[\\/]three[\\/]/ },
            { name: 'r3f', test: /node_modules[\\/](@react-three|postprocessing|maath|three-stdlib|camera-controls)[\\/]/ },
          ],
        },
      },
    },
  },
})
