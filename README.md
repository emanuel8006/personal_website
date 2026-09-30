# personal_website

A space-themed 3D portfolio (Vite + React + React Three Fiber). Full setup, content, texture, and deploy docs are coming in the final polish phase.

## Contact form

The form posts to `POST /api/contact` (`api/contact.ts`, logic in `api/_lib/handleContact.ts`), which validates the message and emails it to you through [Resend](https://resend.com).

**Environment variables** (server-only: never prefix them with `VITE_`, or Vite would ship them to the browser):

| Variable | Required | Purpose |
|---|---|---|
| `RESEND_API_KEY` | yes | Resend API key |
| `CONTACT_TO_EMAIL` | yes | Inbox that receives messages |
| `CONTACT_FROM_EMAIL` | no | Sender, e.g. `Portfolio <hello@yourdomain.com>` (needs a domain verified in Resend) |

- **Local:** copy `.env.example` to `.env.local` (gitignored) and fill it in. Then either `npm run dev` (a small dev-only Vite plugin serves `api/*` handlers) or `vercel dev` (Vercel's own runtime; run `vercel link` once first).
- **Production:** add the same variables in the Vercel dashboard → Project Settings → Environment Variables before the first production deploy.

**Resend test sender:** until you verify a domain in Resend, messages are sent from `onboarding@resend.dev`, which **only delivers to the email address that owns your Resend account**. That's fine for a portfolio: set `CONTACT_TO_EMAIL` to that same address. To send to any inbox (or from your own domain), verify a domain in Resend and set `CONTACT_FROM_EMAIL`.

**Spam and abuse protection:**

- Validation runs in the browser and again on the server (same rules: `api/_lib/contactSchema.ts`).
- A hidden honeypot field and a minimum fill time silently drop most bots. They get a normal-looking success response, so they learn nothing.
- Rate limiting allows 5 messages per 10 minutes per IP and 40 per hour per function instance. This limit lives in instance memory, so it's per-instance, not global. If you ever need a hard global limit, swap `api/_lib/rateLimit.ts` for a Redis-backed limiter (e.g. Upstash).
- Replies go straight to the sender: the email's `Reply-To` is the visitor's address.
