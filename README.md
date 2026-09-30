# Emanuel Galindo Garcia · Portfolio

An explorable, cinematic solar system where every planet is a section of my portfolio. The Sun is About, Earth is Education, Mars is Experience, Jupiter (with one moon per project) is Projects, Saturn (one ring band per skill category) is Skills, and Mercury (one satellite per social link) is Contact. There is also a hidden Planet X.

Phones, low-power devices, and anyone who prefers it get a fast 2D view with the same content.

**Stack:** Vite · React 19 · TypeScript · three.js / React Three Fiber / drei / postprocessing · zustand · framer-motion · Tailwind CSS v4 · Vercel (static site + one serverless function) · Resend.

---

## Local development

Requires Node 20+ (developed on Node 24).

```bash
npm install
cp .env.example .env.local   # optional: only needed for the contact form
npm run dev                   # http://localhost:5173
```

| Script | What it does |
|---|---|
| `npm run dev` | Vite dev server. A small dev-only plugin (`scripts/vite-dev-api.ts`) also serves `api/*` so the contact form works locally. |
| `npm run build` | Type-check, production build, prerender the 2D view into `dist/index.html` (plus `robots.txt` and `sitemap.xml`), verify the CSP, and generate `third-party-licenses.txt`. |
| `npm run preview` | Serve the production build locally. |
| `npm run lint` | oxlint. |
| `npm run textures` | Convert raw textures in `source-textures/` into optimized WebP files in `public/textures/` (see below). |
| `npm run images` | Resize photos (e.g. the portrait) into responsive WebP files. |

**Handy URL flags:**

| Flag | Effect |
|---|---|
| `?view=2d` / `?view=3d` | Force a view. `?view=3d` also disables the automatic low-FPS fallback. |
| `?intro` | Replay the full intro (it normally plays once per browser session). |
| `?planetx` *(dev only)* | Reveal Planet X without hunting for it. |
| `?freeze` *(dev only)* | Stop all orbits. |
| `?cam=x,y,z&look=x,y,z` *(dev only)* | Pin the camera, e.g. for screenshots. |

Planet X discovery is remembered in `localStorage` (`eg:planet-x`). Your 2D/3D choice is remembered under `eg:view`. Clear them to reset.

---

## Editing content

**All copy lives in [`src/data/content.ts`](src/data/content.ts).** Both the 3D panel and the 2D view render from it, so there's nothing to duplicate. Every section has a typed interface at the top of the file.

- **About:** name, tagline, bio paragraphs, photo, and the resume link. The resume is `public/documents/eg_pw_resume.pdf`; replace that file, keeping the name or updating `resume.href`.
- **Education / Experience:** add or remove entries freely. An empty `tech: []` hides the tag row.
- **Projects:** each project automatically becomes a moon of Jupiter tinted with its `accent` color. Add screenshots with `media` (image or short looping video). Links render only when set.
- **Skills:** each category becomes one band of Saturn's rings (inner → outer, in array order). `level` is optional (`'Expert' | 'Proficient' | 'Familiar'`).
- **Contact:** `socials` become buttons in the panel and satellites orbiting Mercury. Supported `kind`s: `linkedin`, `github`, `email`, `x`, `devpost`, `website`, `other`.
- **Personal (Planet X):** blurb, hobbies, fun facts.
- **Tooltips / nav labels:** `SECTIONS`.
- **Credits:** `CREDITS` (shown in the Credits dialog).

Search the file for `[PLACEHOLDER]` and `TODO` to find what's still unfilled. The page `<title>`, description and social tags live in `index.html`.

To add a photo, list it in `scripts/optimize-images.mjs` and run `npm run images`. Then reference the generated `/images/<name>-480.webp` / `-960.webp` files.

---

## Textures

Planet textures come from [Solar System Scope](https://www.solarsystemscope.com/textures/) (CC BY 4.0).

1. Download the originals into **`source-textures/`**. This folder is gitignored, so raw 8K files never enter the repo. Solar System Scope names like `8k_earth_daymap.jpg` or `2k_mars.jpg` are matched automatically.
2. Run `npm run textures`. It writes optimized WebP files to `public/textures/` (never upscaling) and regenerates `src/generated/texture-manifest.json`, which lists the files that exist.
3. Commit `public/textures/` and the manifest.

| Output | Source (Solar System Scope) | Shipped size |
|---|---|---|
| `sun.webp` | `8k_sun.jpg` | 4K |
| `mercury.webp` | `2k_mercury.jpg` | 2K |
| `earth_day.webp` | `8k_earth_daymap.jpg` | 4K |
| `earth_night.webp` | `2k_earth_nightmap.jpg` | 2K |
| `earth_clouds.webp` | `2k/8k_earth_clouds.jpg` | 2K |
| `earth_normal.webp` | `2k_earth_normal_map.tif` | 2K |
| `earth_specular.webp` | `2k_earth_specular_map.tif` | 2K |
| `moon.webp` | `2k_moon.jpg` | 2K |
| `mars.webp` / `jupiter.webp` / `saturn.webp` | `2k_*.jpg` | 2K |
| `saturn_ring.png` | `2k_saturn_ring_alpha.png` | 2K wide |
| `stars_milkyway.webp` | `8k_stars_milky_way.jpg` | 4K |
| `planet_x.webp` | `2k_neptune.jpg` (or Uranus/Pluto) | 2K |

**Changing a resolution:** edit `width` for that entry in `TARGETS` in [`scripts/optimize-textures.mjs`](scripts/optimize-textures.mjs), then re-run the script. To use a different map for a body, match its filename with that entry's `match` regex.

**Missing textures are fine:** any body without a texture, or whose texture fails to load, falls back to a procedural material generated in the browser.

---

## Contact form

The form posts to `POST /api/contact` (`api/contact.ts`, logic in `api/_lib/handleContact.ts`). The function validates the message and emails it to you through [Resend](https://resend.com).

**Environment variables** are server-only. Never prefix them with `VITE_`, or Vite would ship them to the browser.

| Variable | Required | Purpose |
|---|---|---|
| `RESEND_API_KEY` | yes | Resend API key |
| `CONTACT_TO_EMAIL` | yes | Inbox that receives messages |
| `CONTACT_FROM_EMAIL` | no | Sender, e.g. `Portfolio <hello@yourdomain.com>` (needs a domain verified in Resend) |

- **Local:** put them in `.env.local` (gitignored). Then use either `npm run dev` or `vercel dev` (Vercel's own runtime; run `vercel link` once first).
- **Production:** add them in the Vercel dashboard → Project → Settings → Environment Variables, **before the first production deploy**.

**Resend's test sender:** until you verify a domain in Resend, mail is sent from `onboarding@resend.dev`, which **only delivers to the email address that owns your Resend account**. That's fine for a portfolio: set `CONTACT_TO_EMAIL` to that address. To deliver anywhere, or send from your own domain, verify a domain in Resend and set `CONTACT_FROM_EMAIL`.

**Spam and abuse protection:**

- The same validation rules (`api/_lib/contactSchema.ts`) run in the browser and on the server.
- A hidden honeypot field plus a minimum fill time silently drop bots. They get a normal-looking success response.
- Rate limiting allows 5 messages per 10 minutes per IP and 40 per hour per function instance. The limit lives in memory, so it's per instance, not global. For a hard global limit, swap `api/_lib/rateLimit.ts` for a Redis-backed limiter (e.g. Upstash via the Vercel Marketplace).
- `Reply-To` is set to the visitor, so replying answers them directly.

---

## Deploying (Vercel)

The project is Vercel-ready: the Vite preset is auto-detected, `api/` becomes a serverless function, and `vercel.json` only adds cache and security headers.

1. **Add the environment variables** in the Vercel dashboard (see above).
2. Deploy one of two ways:
   - **Git:** import the GitHub repo at [vercel.com/new](https://vercel.com/new). Every push to `main` deploys to production, and other branches get preview URLs.
   - **CLI:**
     ```bash
     vercel link          # once
     vercel               # preview deployment
     vercel --prod        # production
     ```
3. **Canonical and social-preview URLs** are built from Vercel's production domain automatically (`VERCEL_PROJECT_PRODUCTION_URL`). With a custom domain, set `SITE_URL=https://yourdomain.com` in the project's environment variables so `og:image`, the canonical link, and the sitemap use it.
4. After deploying, send yourself a test message through the form.

---

## How it works (short tour)

```
api/                     Vercel function(s); api/_lib is shared code (not routes)
scripts/                 texture/image optimizers, prerender, dev-only Vite plugins
src/data/content.ts      all portfolio content
src/store.ts             zustand: section, hover, intro, quality tier, view mode, easter eggs
src/lib/capability.ts    3D vs 2D decision + per-tier render settings
src/scene/               R3F scene: Sun, planets, rings, belt, stars, camera rig, effects
src/ui/                  HUD, content panel, sections, minimap, tooltip, intro, cursor
src/fallback/            2D PlainView (also prerendered at build time)
```

- **3D vs 2D:** decided once at startup. Phones, no WebGL2, `prefers-reduced-data`, very low-end hardware, and software GPUs get 2D. The 3D view adapts its quality tier with drei's `PerformanceMonitor`, and falls back to 2D on sustained low FPS or a lost GPU context. The 3D code is split into its own chunks, so the 2D view never downloads three.js.
- **Accessibility:** all panel content is real DOM text with proper landmarks and headings. Every planet is reachable from the text nav and the minimap (both keyboard-accessible). Escape closes, ←/→ switch sections, and focus moves into the panel and back.
- **Reduced motion:** skips the intro and turns camera flights into quick fades. It also disables the spaceship cursor, shooting stars, chromatic aberration, and the 2D star drift.
- **SEO:** the 2D view is prerendered into `index.html`, so crawlers and no-JS visitors get the full content. That prerendered copy is hidden as soon as JavaScript runs. `index.html` also carries Open Graph and Twitter tags, schema.org `Person` data, a sitemap, and `robots.txt`.
- **Security:**
  - No secrets in the client. Server env vars are read only in `api/`, and the build contains no key material.
  - The contact endpoint rejects cross-origin posts and validates and size-limits input. It rate-limits, drops bots via the honeypot and timing checks, escapes HTML, and never logs message content.
  - `vercel.json` sets a strict Content-Security-Policy (no inline scripts except one hash-allowlisted line, which the build verifies), HSTS, `frame-ancestors 'none'`/`X-Frame-Options`, `nosniff`, a Referrer-Policy, COOP, and a locked-down Permissions-Policy. `npm run preview` serves the same headers, so CSP problems show up locally.
  - The CSP blocks Vercel's preview-deployment toolbar. That's expected and doesn't affect production.
- **Privacy:** no cookies, analytics, or tracking. `localStorage`/`sessionStorage` hold only UI preferences: intro seen, 2D/3D choice, paused motion, and Planet X found. The contact form states where messages go. Shipped images are stripped of EXIF metadata by the optimize scripts.
- **Motion:** a "Pause motion" control (WCAG 2.2.2) stills orbits, spin, twinkle, drift, meteors, and blinking beacons, and is remembered between visits.
- **Easter eggs:** a suspicious asteroid, the Konami code, a faint ✦ in the 2D footer, and a message in the browser console.

---

## Credits

Full license notices for every open-source package are generated at build time into `/third-party-licenses.txt`, linked from the site's Credits dialog.

- **Planet textures** by [Solar System Scope](https://www.solarsystemscope.com/textures/), licensed [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/), based on NASA imagery.
- **Fonts:** Space Grotesk, Inter, and JetBrains Mono, via [Fontsource](https://fontsource.org) (SIL Open Font License 1.1).
- **3D:** [three.js](https://threejs.org), [React Three Fiber](https://github.com/pmndrs/react-three-fiber), [drei](https://github.com/pmndrs/drei), [postprocessing](https://github.com/pmndrs/postprocessing) (MIT).
