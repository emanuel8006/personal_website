import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { devApi } from './scripts/vite-dev-api.ts'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), devApi()],
  build: {
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
