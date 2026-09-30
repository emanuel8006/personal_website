import { Resend } from 'resend'
import {
  MIN_FILL_MS,
  normalizeContact,
  validateContact,
  type ContactInput,
  type ContactResponse,
} from './contactSchema.js'
import { rateLimit } from './rateLimit.js'

/**
 * Contact endpoint logic (the route file api/contact.ts just wires it up):
 * validates a submission and emails it to CONTACT_TO_EMAIL through Resend.
 *
 * Environment (server-only; never prefix with VITE_):
 *   RESEND_API_KEY      required
 *   CONTACT_TO_EMAIL    required: where messages are delivered
 *   CONTACT_FROM_EMAIL  optional: verified sender, e.g. "Portfolio <hello@yourdomain.com>".
 *                       Defaults to Resend's test sender, which only delivers to
 *                       the Resend account owner's own address.
 */

const MAX_BODY_BYTES = 16 * 1024
const PER_IP = { limit: 5, windowMs: 10 * 60 * 1000 } // 5 messages / 10 min per visitor
const GLOBAL = { limit: 40, windowMs: 60 * 60 * 1000 } // 40 / hour per instance, protects the Resend quota
const DEFAULT_FROM = 'Portfolio Contact <onboarding@resend.dev>'

export type SendEmail = (msg: ContactInput) => Promise<{ ok: true } | { ok: false; reason: string }>

const json = (body: ContactResponse, status: number, headers: Record<string, string> = {}) =>
  Response.json(body, { status, headers: { 'Cache-Control': 'no-store', ...headers } })

const escapeHtml = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!)

function clientIp(request: Request) {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || 'unknown'
}

/** Real sender, or null when the environment isn't configured. */
export function resendSender(): SendEmail | null {
  const apiKey = process.env.RESEND_API_KEY
  const to = process.env.CONTACT_TO_EMAIL
  if (!apiKey || !to) return null

  const resend = new Resend(apiKey)
  return async ({ name, email, message }) => {
    const { error } = await resend.emails.send({
      from: process.env.CONTACT_FROM_EMAIL || DEFAULT_FROM,
      to,
      replyTo: email, // hitting Reply answers the visitor directly
      subject: `Portfolio message from ${name}`,
      text: `${message}\n\n———\nFrom: ${name} <${email}>\nSent via the portfolio contact form`,
      html: `<div style="font-family:system-ui,sans-serif;line-height:1.5">
        <p style="white-space:pre-wrap">${escapeHtml(message)}</p>
        <hr style="border:none;border-top:1px solid #ddd" />
        <p style="color:#555;font-size:13px">From: ${escapeHtml(name)} &lt;${escapeHtml(email)}&gt;<br />Sent via the portfolio contact form</p>
      </div>`,
    })
    return error ? { ok: false, reason: `${error.name}: ${error.message}` } : { ok: true }
  }
}

/** Request handling, with the email sender injected (so it can be tested without sending). */
export async function handleContact(request: Request, send: SendEmail | null): Promise<Response> {
  if (!(request.headers.get('content-type') ?? '').includes('application/json')) {
    return json({ ok: false, error: 'Expected a JSON body.' }, 415)
  }
  if (Number(request.headers.get('content-length') ?? 0) > MAX_BODY_BYTES) {
    return json({ ok: false, error: 'That message is too large.' }, 413)
  }

  const ip = clientIp(request)
  const perIp = rateLimit(`ip:${ip}`, PER_IP.limit, PER_IP.windowMs)
  const global = perIp.ok ? rateLimit('global', GLOBAL.limit, GLOBAL.windowMs) : perIp
  if (!perIp.ok || !global.ok) {
    const retryAfter = Math.max(perIp.retryAfter, global.retryAfter)
    return json({ ok: false, error: 'You’ve sent a few messages already. Please try again in a few minutes.' }, 429, {
      'Retry-After': String(retryAfter),
    })
  }

  let body: Record<string, unknown>
  try {
    const raw = await request.text()
    if (raw.length > MAX_BODY_BYTES) return json({ ok: false, error: 'That message is too large.' }, 413)
    body = JSON.parse(raw)
  } catch {
    return json({ ok: false, error: 'Couldn’t read that request.' }, 400)
  }

  // Spam traps: a filled honeypot, or a form "filled in" faster than a human can.
  // Answer with a normal success so bots learn nothing.
  const elapsed = typeof body.elapsedMs === 'number' ? body.elapsedMs : 0
  if ((typeof body.website === 'string' && body.website.trim() !== '') || elapsed < MIN_FILL_MS) {
    return json({ ok: true }, 200)
  }

  const input = normalizeContact(body)
  const fields = validateContact(input)
  if (Object.keys(fields).length > 0) {
    return json({ ok: false, error: 'Please fix the highlighted fields.', fields }, 400)
  }

  if (!send) {
    console.error('[contact] Not configured: set RESEND_API_KEY and CONTACT_TO_EMAIL')
    return json({ ok: false, error: 'The contact form isn’t set up yet. Please reach out on LinkedIn instead.' }, 503)
  }

  try {
    const result = await send(input)
    if (!result.ok) {
      console.error('[contact] Resend rejected the message:', result.reason)
      return json({ ok: false, error: 'Your message couldn’t be sent right now. Please try again shortly.' }, 502)
    }
  } catch (err) {
    console.error('[contact] Send failed:', err instanceof Error ? err.message : err)
    return json({ ok: false, error: 'Your message couldn’t be sent right now. Please try again shortly.' }, 502)
  }

  return json({ ok: true }, 200)
}
