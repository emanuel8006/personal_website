/**
 * Contact form rules, shared by the browser (instant feedback) and the
 * serverless function (the real gatekeeper). Pure: no Node or DOM APIs.
 *
 * Lives under api/_lib: the leading underscore tells Vercel this folder is
 * shared code, not a route.
 */

export const LIMITS = {
  name: { min: 1, max: 100 },
  email: { max: 254 },
  message: { min: 10, max: 5000 },
} as const

/** Submissions arriving faster than this after the form rendered are treated as bots. */
export const MIN_FILL_MS = 2000

export interface ContactInput {
  name: string
  email: string
  message: string
}

export type ContactField = keyof ContactInput
export type FieldErrors = Partial<Record<ContactField, string>>

/** JSON body the browser sends. `website` is the honeypot; `elapsedMs` is time since render. */
export interface ContactRequestBody extends ContactInput {
  website?: string
  elapsedMs?: number
}

export type ContactResponse = { ok: true } | { ok: false; error: string; fields?: FieldErrors }

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
// C0 control characters except tab/newline/carriage return
// eslint-disable-next-line no-control-regex
const CONTROL_RE = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g

const clean = (v: unknown) => (typeof v === 'string' ? v.replace(CONTROL_RE, '').trim() : '')

/** Coerce untrusted input into trimmed strings (anything else becomes ''). */
export function normalizeContact(input: unknown): ContactInput {
  const o = (input && typeof input === 'object' ? input : {}) as Record<string, unknown>
  return {
    name: clean(o.name).replace(/\s+/g, ' '), // single line: it goes in the subject
    email: clean(o.email).toLowerCase(),
    message: clean(o.message).replace(/\r\n?/g, '\n'),
  }
}

export function validateContact({ name, email, message }: ContactInput): FieldErrors {
  const errors: FieldErrors = {}

  if (name.length < LIMITS.name.min) errors.name = 'Please tell me your name.'
  else if (name.length > LIMITS.name.max) errors.name = `Please keep your name under ${LIMITS.name.max} characters.`

  if (!email) errors.email = 'Please add your email so I can reply.'
  else if (email.length > LIMITS.email.max || !EMAIL_RE.test(email))
    errors.email = 'That email address doesn’t look quite right.'

  if (message.length < LIMITS.message.min) errors.message = `Please write at least ${LIMITS.message.min} characters.`
  else if (message.length > LIMITS.message.max)
    errors.message = `Please keep it under ${LIMITS.message.max} characters.`

  return errors
}
