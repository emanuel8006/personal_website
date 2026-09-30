import { existsSync } from 'node:fs'
import type { IncomingMessage } from 'node:http'
import { join } from 'node:path'
import { loadEnv, type Plugin } from 'vite'

/** Server-only variables forwarded to dev API routes (read from .env / .env.local). */
const API_ENV = ['RESEND_API_KEY', 'CONTACT_TO_EMAIL', 'CONTACT_FROM_EMAIL']

async function readBody(req: IncomingMessage) {
  const chunks: Buffer[] = []
  for await (const chunk of req) chunks.push(chunk as Buffer)
  return Buffer.concat(chunks)
}

/**
 * Dev-only: serves `api/<name>.ts` Web handlers (export GET/POST/…) from the
 * Vite dev server, so `npm run dev` exercises the contact form end to end
 * without `vercel dev`. Production uses Vercel's own function runtime.
 */
export function devApi(): Plugin {
  return {
    name: 'dev-api',
    apply: 'serve',
    configureServer(server) {
      const env = loadEnv(server.config.mode, server.config.root, '')
      for (const key of API_ENV) if (env[key] && !process.env[key]) process.env[key] = env[key]

      server.middlewares.use(async (req, res, next) => {
        const path = req.url?.split('?')[0] ?? ''
        const match = /^\/api\/([a-z0-9-]+)$/.exec(path)
        if (!match) return next()
        if (!existsSync(join(server.config.root, 'api', `${match[1]}.ts`))) {
          res.statusCode = 404
          return res.end()
        }
        try {
          const mod = await server.ssrLoadModule(`/api/${match[1]}.ts`)
          const method = req.method ?? 'GET'
          const handler = mod[method]
          if (typeof handler !== 'function') {
            res.statusCode = 405
            return res.end()
          }
          const headers = new Headers()
          for (const [k, v] of Object.entries(req.headers)) if (typeof v === 'string') headers.set(k, v)
          const body = method === 'GET' || method === 'HEAD' ? undefined : await readBody(req)
          const response: Response = await handler(
            new Request(`http://${req.headers.host}${req.url}`, { method, headers, body }),
          )
          res.statusCode = response.status
          response.headers.forEach((value, key) => res.setHeader(key, value))
          res.end(Buffer.from(await response.arrayBuffer()))
        } catch (err) {
          server.ssrFixStacktrace(err as Error)
          next(err)
        }
      })
    },
  }
}
