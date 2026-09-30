#!/usr/bin/env node
/**
 * Post-build step: renders the 2D view to static HTML and injects it (plus
 * schema.org structured data) into dist/index.html.
 *
 * The markup is hidden as soon as JavaScript runs (see the inline script in
 * index.html), so interactive visitors never see it; crawlers and no-JS
 * visitors get the full, real content.
 */
import { createHash } from 'node:crypto'
import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createServer } from 'vite'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const OUT = path.join(ROOT, 'dist', 'index.html')

const siteUrl =
  process.env.SITE_URL?.replace(/\/$/, '') ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : 'http://localhost:5173')

/**
 * Fail the build if any executable inline <script> in the final HTML isn't
 * allowlisted (by hash) in the CSP in vercel.json, which would silently break it in production.
 */
async function checkCsp(html) {
  const vercel = JSON.parse(await readFile(path.join(ROOT, 'vercel.json'), 'utf8'))
  const csp = vercel.headers.flatMap((h) => h.headers).find((h) => h.key === 'Content-Security-Policy')?.value ?? ''
  const inline = [...html.matchAll(/<script(?![^>]*\bsrc=)([^>]*)>([\s\S]*?)<\/script>/g)].filter(
    ([, attrs]) => !/type="application\/ld\+json"/.test(attrs), // data blocks aren't executed
  )
  for (const [, , code] of inline) {
    const hash = `'sha256-${createHash('sha256').update(code).digest('base64')}'`
    if (!csp.includes(hash)) throw new Error(`Inline script not allowed by the CSP in vercel.json. Add ${hash} to script-src.`)
  }
  console.log(`✓ CSP allows all ${inline.length} inline script(s)`)
}

const server = await createServer({ root: ROOT, server: { middlewareMode: true }, appType: 'custom', logLevel: 'error' })
try {
  const { render, structuredData } = await server.ssrLoadModule('/src/fallback/prerender.tsx')
  let html = await readFile(OUT, 'utf8')
  if (!html.includes('<!--prerender-->')) throw new Error('dist/index.html has no <!--prerender--> marker')

  const body = render()
  // JSON in a <script> must not be able to close the tag early
  const ld = JSON.stringify(structuredData(siteUrl)).replace(/</g, '\\u003c')

  html = html
    .replace('<!--prerender-->', `<div data-prerendered>${body}</div>`)
    .replace('</head>', `  <script type="application/ld+json">${ld}</script>\n  </head>`)
  await writeFile(OUT, html)
  await checkCsp(html)

  // Crawl hints (absolute URLs, so they're generated per build)
  const DIST = path.dirname(OUT)
  await writeFile(path.join(DIST, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${siteUrl}/sitemap.xml\n`)
  await writeFile(
    path.join(DIST, 'sitemap.xml'),
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url><loc>${siteUrl}/</loc><lastmod>${new Date().toISOString().slice(0, 10)}</lastmod></url>\n</urlset>\n`,
  )
  console.log(`✓ prerendered 2D view into dist/index.html (${(body.length / 1024).toFixed(0)} KB of HTML) + robots.txt, sitemap.xml`)
} finally {
  await server.close()
}
