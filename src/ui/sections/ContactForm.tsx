import { useEffect, useId, useRef, useState, type FormEvent } from 'react'
import {
  LIMITS,
  normalizeContact,
  validateContact,
  type ContactField,
  type ContactInput,
  type ContactResponse,
  type FieldErrors,
} from '../../../api/_lib/contactSchema'
import { CONTACT } from '../../data/content'
import { buttonClass } from '../components/styles'

type Status = 'idle' | 'sending' | 'success' | 'error'

const REQUEST_TIMEOUT_MS = 15000

const EMPTY: ContactInput = { name: '', email: '', message: '' }

// Draft survives the panel closing/reopening (and switching 3D ↔ 2D) within the session.
const draftStore = { value: EMPTY }
const saveDraft = (next: ContactInput) => {
  draftStore.value = next
}
const msSince = (t: number) => Date.now() - t

const inputClass = (invalid: boolean) =>
  `w-full rounded-xl border bg-white/[0.04] px-3.5 py-2.5 text-[15px] text-white placeholder:text-slate-500 transition focus:bg-white/[0.06] focus:outline-none focus-visible:ring-2 ${
    invalid
      ? 'border-rose-400/70 focus-visible:ring-rose-300/60'
      : 'border-white/12 hover:border-white/25 focus-visible:border-cyan/60 focus-visible:ring-cyan/40'
  }`

export default function ContactForm() {
  const id = useId()
  const [values, setValues] = useState<ContactInput>(() => draftStore.value)
  const [touched, setTouched] = useState<Partial<Record<ContactField, boolean>>>({})
  const [serverErrors, setServerErrors] = useState<FieldErrors>({})
  const [status, setStatus] = useState<Status>('idle')
  const [message, setMessage] = useState('')
  const honeypot = useRef<HTMLInputElement>(null)
  const startedAt = useRef(0)
  const successHeading = useRef<HTMLHeadingElement>(null)
  const fieldRefs = useRef<Partial<Record<ContactField, HTMLInputElement | HTMLTextAreaElement | null>>>({})

  useEffect(() => {
    startedAt.current = Date.now()
  }, [])

  useEffect(() => {
    if (status === 'success') successHeading.current?.focus()
  }, [status])

  const clientErrors = validateContact(normalizeContact(values))
  const errorFor = (field: ContactField) => serverErrors[field] ?? (touched[field] ? clientErrors[field] : undefined)

  const update = (field: ContactField, value: string) => {
    const next = { ...values, [field]: value }
    saveDraft(next)
    setValues(next)
    if (serverErrors[field]) setServerErrors((e) => ({ ...e, [field]: undefined }))
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (status === 'sending') return

    setTouched({ name: true, email: true, message: true })
    const firstInvalid = (['name', 'email', 'message'] as const).find((f) => clientErrors[f])
    if (firstInvalid) {
      fieldRefs.current[firstInvalid]?.focus()
      return
    }

    setStatus('sending')
    setMessage('')
    const controller = new AbortController()
    const timer = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...values,
          website: honeypot.current?.value ?? '',
          elapsedMs: msSince(startedAt.current),
        }),
        signal: controller.signal,
      })
      const data = (await res.json().catch(() => null)) as ContactResponse | null

      if (res.ok && data?.ok) {
        setStatus('success')
        saveDraft(EMPTY)
        return
      }
      if (data && !data.ok && data.fields) setServerErrors(data.fields)
      setStatus('error')
      setMessage(data && !data.ok ? data.error : 'Something went wrong on my end. Please try again in a moment.')
    } catch (err) {
      setStatus('error')
      setMessage(
        (err as Error).name === 'AbortError'
          ? 'The request timed out. Please check your connection and try again.'
          : 'Couldn’t reach the server. Please check your connection and try again.',
      )
    } finally {
      window.clearTimeout(timer)
    }
  }

  const linkedin = CONTACT.socials.find((s) => s.kind === 'linkedin')

  if (status === 'success') {
    return (
      <div className="rounded-2xl border border-emerald-300/30 bg-emerald-300/[0.06] p-5" role="status">
        <h3
          ref={successHeading}
          tabIndex={-1}
          className="font-display text-lg font-semibold text-white focus:outline-none"
        >
          Message received. Thank you!
        </h3>
        <p className="mt-1 text-[15px] text-slate-300">
          It landed in my inbox and I’ll reply to <span className="text-white">{values.email}</span> soon.
        </p>
        <button
          type="button"
          className={`${buttonClass.ghost} mt-4`}
          onClick={() => {
            setValues(EMPTY)
            setTouched({})
            setStatus('idle')
            startedAt.current = Date.now()
          }}
        >
          Send another message
        </button>
      </div>
    )
  }

  const field = (name: ContactField, label: string, autoComplete: string, type = 'text') => {
    const err = errorFor(name)
    const errId = `${id}-${name}-error`
    const common = {
      id: `${id}-${name}`,
      name,
      value: values[name],
      required: true,
      'aria-invalid': err ? true : undefined,
      'aria-describedby': err ? errId : undefined,
      onBlur: () => setTouched((t) => ({ ...t, [name]: true })),
      className: inputClass(Boolean(err)),
    }
    return (
      <div className="space-y-1.5">
        <div className="flex items-baseline justify-between">
          <label htmlFor={common.id} className="text-sm font-medium text-slate-200">
            {label}
          </label>
          {name === 'message' && (
            <span
              className={`font-mono text-[11px] ${values.message.length > LIMITS.message.max ? 'text-rose-300' : 'text-slate-400'}`}
              aria-hidden="true"
            >
              {values.message.length}/{LIMITS.message.max}
            </span>
          )}
        </div>
        {name === 'message' ? (
          <textarea
            {...common}
            ref={(el) => {
              fieldRefs.current.message = el
            }}
            rows={6}
            maxLength={LIMITS.message.max + 200}
            placeholder="What would you like to talk about?"
            onChange={(e) => update(name, e.target.value)}
            className={`${common.className} min-h-32 resize-y`}
          />
        ) : (
          <input
            {...common}
            ref={(el) => {
              fieldRefs.current[name] = el
            }}
            type={type}
            autoComplete={autoComplete}
            maxLength={name === 'name' ? LIMITS.name.max + 20 : LIMITS.email.max}
            onChange={(e) => update(name, e.target.value)}
          />
        )}
        {err && (
          <p id={errId} className="text-sm text-rose-300">
            {err}
          </p>
        )}
      </div>
    )
  }

  return (
    <form noValidate onSubmit={onSubmit} className="relative space-y-4" aria-describedby={`${id}-status`}>
      <div className="grid gap-4 sm:grid-cols-2">
        {field('name', 'Name', 'name')}
        {field('email', 'Email', 'email', 'email')}
      </div>
      {field('message', 'Message', 'off')}

      {/* Honeypot: invisible to people and screen readers; bots tend to fill every field */}
      <div aria-hidden="true" className="absolute -left-[10000px] h-px w-px overflow-hidden">
        <label>
          Website
          <input ref={honeypot} type="text" name="website" tabIndex={-1} autoComplete="off" defaultValue="" />
        </label>
      </div>

      <div className="flex flex-wrap items-center gap-3 pt-1">
        <button type="submit" disabled={status === 'sending'} className={`${buttonClass.primary} disabled:opacity-70`}>
          {status === 'sending' ? (
            <>
              <span
                aria-hidden="true"
                className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-space/30 border-t-space"
              />
              Sending…
            </>
          ) : (
            'Send message'
          )}
        </button>
        <p id={`${id}-status`} role="status" aria-live="polite" className="text-sm text-rose-300">
          {status === 'error' && (
            <>
              {message}
              {linkedin && (
                <>
                  {' '}
                  You can also reach me on{' '}
                  <a
                    href={linkedin.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline underline-offset-2"
                  >
                    LinkedIn
                  </a>
                  .
                </>
              )}
            </>
          )}
        </p>
      </div>
    </form>
  )
}
