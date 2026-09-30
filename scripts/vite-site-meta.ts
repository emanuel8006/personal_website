import type { Plugin } from 'vite'

/**
 * Fills `%SITE_URL%` in index.html (canonical + Open Graph URLs must be absolute).
 * Resolution order: SITE_URL env (e.g. a custom domain) → Vercel's production
 * domain (set automatically on Vercel builds) → http://localhost:5173.
 */
export function siteMeta(): Plugin {
  const fromEnv = process.env.SITE_URL?.replace(/\/$/, '')
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL
  const url = fromEnv || (vercel ? `https://${vercel}` : 'http://localhost:5173')
  return {
    name: 'site-meta',
    transformIndexHtml: (html) => html.replaceAll('%SITE_URL%', url),
  }
}
