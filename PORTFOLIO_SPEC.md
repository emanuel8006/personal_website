# Space-Themed 3D Portfolio: Project Spec

Read this whole file before writing any code. Work in the phases listed at the bottom, commit after each phase, and ask me before deviating from anything marked MUST.

---

## 1. Concept

A personal portfolio where the whole site is an explorable, cinematic solar system. The Sun is the landing view and intro. Each planet is a section of my portfolio. Clicking a planet flies the camera to it, then a content panel slides over the scene. The goal is to look creative and impressive while still being fast, usable, and easy for a recruiter to skim.

Audience is a mix of recruiters and hiring managers, fellow developers, and professors or club and admissions reviewers. That means the 3D experience has to be memorable, but the actual information must be easy to reach and read. Never make someone fight the 3D to find my resume info.

Visual style: realistic and cinematic. Textured planets, a glowing sun with bloom and corona, atmospheric glow on planets, a nebula backdrop, and deep starfield parallax. Think film-quality space, not cartoon or low-poly.

---

## 2. Tech Stack (MUST)

- Vite + React + TypeScript
- three, @react-three/fiber, @react-three/drei
- @react-three/postprocessing (Bloom, subtle Vignette, optional ChromaticAberration during camera flights)
- zustand for app state (current section, hover target, intro state, quality tier, view mode)
- framer-motion for content panel and UI animation
- Tailwind CSS for all non-canvas UI
- Camera flights: drei `CameraControls` (or a custom eased tween with `maath`/`gsap`). Pick whichever gives smooth, interruptible transitions.
- Contact form backend: a Vercel serverless function at `/api/contact` that sends email through Resend (free tier is plenty). Fallback option if I would rather avoid any backend: Web3Forms or Formspree.
- Hosting: Vercel (I have used it before). Keep the project structure compatible with Vercel's `api/` directory for serverless functions.

Suggested structure:

```
/api/contact.ts            serverless email endpoint
/public/textures/          planet, sun, ring, backdrop textures (optimized WebP, see Texture Plan)
/public/documents/         resume.pdf (public-safe version, already stripped of phone and home address)
/public/images/            profile photo, project screenshots and GIFs
/public/og-image.png       social share preview image
/src/data/content.ts       ALL portfolio content lives here (single source of truth)
/src/scene/                Scene, SolarSystem, Sun, Planet, Rings, AsteroidBelt, Starfield, ShootingStars, CameraRig
/src/ui/                   ContentPanel, sections/*, Minimap, Tooltip, IntroOverlay, Cursor, ViewToggle, Nav
/src/fallback/             PlainView (2D version)
/src/store.ts              zustand store
/src/hooks/                useQualityTier, useReducedMotion, etc.
```

---

## 3. Section-to-Planet Mapping (MUST)

Each body has a themed reason. Reflect that theme in the tooltip teaser text and in subtle visual details.

| Body | Section | Why | Visual notes |
|---|---|---|---|
| Sun | Intro / About Me | Center of everything, where the story starts | Animated emissive surface shader, corona sprites, strong bloom. Name and tagline appear here on first load. |
| Earth | Education | Home base, where I learned everything | Day texture, cloud layer rotating slightly faster, blue fresnel atmosphere, small orbiting moon |
| Mars | Work Experience | Missions and real-world deployment | Red textured surface, subtle dust glow. Each role is shown as a "mission log" entry. |
| Jupiter | Projects | Biggest planet for the biggest section | Banded gas texture. Each project is a moon orbiting Jupiter. Clicking a moon focuses on that project inside the panel. |
| Saturn | Skills | Rings map naturally to categories | Textured rings with alpha. Each ring or ring segment is a skill category (Languages, Backend, Data, Tools, etc.). |
| Mercury | Contact | The messenger, fastest to reply | Small, close to the sun. A small ring of satellites orbits it, one per social link (LinkedIn, GitHub, others). |
| Hidden "Planet X" | Personal / fun facts (easter egg) | Something for people who explore | See easter eggs below. Not in the nav or minimap until discovered. |

Orbit order outward from the Sun: Mercury, Earth, Mars, [asteroid belt], Jupiter, Saturn, then far out, Planet X.

Scale is artistic, not realistic. Planets must be big enough to click comfortably. Orbit radii should be spread so the whole system reads clearly from the opening wide shot.

---

## 4. Navigation and Interaction (MUST)

**Opening shot:** wide, slightly above the orbital plane, with a slow ambient drift. All planets visible.

**Hover (desktop):**
- Planet gets a soft rim glow and scales up very slightly
- A tooltip label appears next to it with the section name and a one-line teaser (for example, Mars: "Missions I've flown")
- Cursor changes to indicate it is clickable
- The planet's orbit slows or pauses while hovered so it is easy to click

**Click a planet:**
1. Orbits pause
2. Camera flies to the planet with an eased 1.5 to 2 second transition, arriving with the planet framed on the left third of the screen
3. Content panel slides in from the right (about 45 percent width on desktop) with a glassmorphism look (blurred translucent dark panel, thin luminous border)
4. Other bodies dim slightly

**Leaving:** a clear "Back to Solar System" button, plus the Escape key. The camera flies back to the opening shot and orbits resume.

**Planet to planet:** clicking a nav item or minimap dot while a panel is open flies directly to the next planet without going back to the wide shot first.

**Interruptible:** clicking during a flight redirects the camera smoothly. Never leave the camera in a broken state.

**Keyboard:** Tab moves through planets/nav items in a sensible order, Enter opens, Escape closes, arrow keys move to next or previous section while a panel is open. Visible focus states.

---

## 5. Content Panel Sections

All copy comes from `src/data/content.ts`. Build the sections against placeholder data (clearly marked `TODO` or `[PLACEHOLDER]`) so I can fill in real content later. Typed interfaces for every section.

**About (Sun):** name, one-line tagline, a short bio paragraph, a profile photo slot (optional), and buttons for "Download Resume" (links to `/documents/resume.pdf`, served from `public/documents/`, with a download attribute) and "View Projects".

**Education (Earth):** school, degree(s), graduation date, GPA (optional flag to hide), relevant coursework as chips, honors and clubs.

**Work Experience (Mars):** vertical timeline styled like mission logs. Each entry has company, role, dates, location, 3 to 4 impact bullets, and a tech stack tag list.

**Projects (Jupiter):** grid or carousel of project cards. Each has title, one-line pitch, longer description, tech tags, links (GitHub, live demo), and an image or GIF slot. Each project is also represented as a moon. Cards should emphasize technical depth (architecture, data, scale, results), not just screenshots.

**Skills (Saturn):** grouped by category matching the rings. Show as chips or bars with categories clearly labeled. No fake percentage bars, use levels or just grouped tags.

**Contact (Mercury):**
- Form with Name, Email, Message
- Honeypot hidden field for spam, client and server validation, basic rate limiting on the endpoint
- Clear states: idle, sending, success, error, with friendly messages
- POSTs to `/api/contact`, which sends the message to my email via Resend using environment variables (`RESEND_API_KEY`, `CONTACT_TO_EMAIL`). Never expose keys client-side.
- Secrets live in `.env.local` (gitignored) for local dev and in the Vercel dashboard (Project Settings, Environment Variables) for production. Variable names must NOT start with `VITE_`, because Vite ships those to the browser. Commit a `.env.example` with the variable names and blank values. Do not read, print, or log the contents of any `.env*` file, and never hardcode a key. I will add the real values myself.
- Test the endpoint locally with `vercel dev` so the `api/` function runs alongside the app.
- Social links: LinkedIn, GitHub, plus a configurable list for other platforms. Shown as icon buttons in the panel AND as small satellites orbiting Mercury, each clickable.
- Note: until a domain is verified in Resend, its test sender only delivers to the account owner's email, which is fine for this use case. Document this in the README.

---

## 6. Extras (MUST include all of these)

**Cinematic loading and intro sequence**
- Use drei `useProgress` for a real loading bar over a black screen with a minimal, elegant loader
- Once loaded: fade from black, stars come into view, camera pulls back from the Sun to the opening shot while my name and tagline fade in
- "Skip intro" button always visible
- Only play the full intro on the first visit per session (`sessionStorage`), otherwise a quick fade-in

**Custom cursor / spaceship**
- Desktop only, hidden on touch devices
- A small spaceship that follows the mouse with smooth lag and rotates toward its direction of movement, with a faint thruster trail
- Falls back to the normal cursor over form fields and text inputs
- Must not hurt performance, use a lightweight DOM/CSS or single canvas overlay, not a heavy 3D object

**Hidden easter eggs**
- Asteroid belt between Mars and Jupiter using instanced meshes, slowly rotating
- Random shooting stars streaking across the background every so often
- A hidden "Planet X" far out. It is discovered by clicking a specific special asteroid in the belt (and also by the Konami code). When found, it appears on the minimap and opens a Personal panel (hobbies, fun facts, a short "off the clock" blurb). A small toast says "You found Planet X".
- A friendly message in the browser console for developers who open it

**Hover effects and tooltips:** as described in section 4, polished and consistent across all planets and moons.

**Minimap / orbit tracker**
- Small HUD in a bottom corner showing a top-down view of the orbits with a dot per planet
- Current section highlighted, hover shows the section name, clicking a dot flies there
- Doubles as accessible navigation. Also include a simple text nav (section names) somewhere unobtrusive.

---

## 7. Visual and Rendering Details

- Background: nebula equirectangular texture on a big sphere, plus drei `Stars` for parallax depth
- Sun: emissive shader with animated noise, layered corona sprites, point light at center, Bloom picks it up
- Planets: high-quality textures, slow axial rotation, `meshStandardMaterial` with normal/specular maps where available, custom fresnel atmosphere shader for Earth (and a lighter one on Mars, Jupiter and Saturn)
- Saturn's rings: ring geometry with alpha texture, correct UV mapping, casting a soft shadow if feasible
- Lighting: sun as the main light, very low ambient so the dark sides feel real
- Color palette: deep space navy/black (`#05060f`), warm amber for the Sun, cool cyan and soft violet for UI accents
- Typography: Space Grotesk for headings, Inter for body, JetBrains Mono for HUD labels and tooltips
- Motion: everything eased, nothing linear or jittery. Subtle chromatic aberration only during camera flights.
- Textures: follow the Texture Plan in section 7b. If a texture is missing, fall back to a procedural material so the app still runs.

---

## 7b. Texture Plan (MUST)

**Source:** Solar System Scope textures from the official page, solarsystemscope.com/textures. They are based on NASA imagery and licensed CC BY 4.0, so a credit is required (see below). I will download the files myself and place them in a `source-textures/` folder in the project root. Before I do, give me the exact list of files to download.

**Keep raw downloads out of the repo.** Add `/source-textures/` to `.gitignore`. Write a small script (for example `scripts/optimize-textures.mjs` using `sharp`) that converts the originals into optimized web files in `public/textures/`, so the process is repeatable.

**Target output files** (WebP unless noted, keep total texture payload reasonably small, roughly 15 MB or less):

| File | Used for | Target size |
|---|---|---|
| `sun.webp` | Sun surface | 4K |
| `mercury.webp` | Mercury | 2K |
| `earth_day.webp` | Earth color | 4K |
| `earth_night.webp` | Earth city lights (optional glow on dark side) | 2K |
| `earth_clouds.webp` | Cloud layer (needs alpha or use as alphaMap) | 2K to 4K |
| `earth_normal.webp` | Earth relief | 2K |
| `earth_specular.webp` | Ocean shine | 2K |
| `moon.webp` | Earth's moon | 2K |
| `mars.webp` | Mars | 2K |
| `jupiter.webp` | Jupiter | 2K |
| `saturn.webp` | Saturn body | 2K |
| `saturn_ring.png` | Saturn rings (keep alpha, PNG or WebP with alpha) | 2K wide |
| `stars_milkyway.webp` | Equirectangular background sphere | 4K |
| `planet_x.webp` | Hidden Planet X (Uranus, Neptune, or Pluto map, pick one) | 2K |

Do not use the 8K versions for shipping, they are too heavy for a portfolio site. If I later want higher fidelity on a hero planet, make the resolution easy to swap in one place.

**Loading:** load textures with drei `useTexture` or `useProgress`-aware loaders so the intro loading bar reflects real progress. Set correct color space (`SRGBColorSpace`) on color maps and leave normal and specular maps linear. Enable anisotropy on the planet maps.

**Credits (MUST):** add a small "Credits" link in the footer and a section in the README that reads roughly: "Planet textures by Solar System Scope (solarsystemscope.com), licensed CC BY 4.0, based on NASA imagery." Include any other source I end up using.

**Alternate sources if a map is missing or I want a different look:** NASA Visible Earth and NASA 3D Resources (public domain), NASA SVS deep star maps (public domain), ESA/Webb and Hubble imagery for a real nebula backdrop (check each image's credit line), and Planet Pixel Emporium (free, credit requested).

---

## 8. Performance, Fallback, Accessibility (MUST)

**Quality tiers:** detect device capability and choose `high`, `medium`, or `low` (or 2D). Use drei `PerformanceMonitor` to degrade automatically (lower DPR, fewer asteroids, disable bloom or post effects) if frame rate drops.

**Desktop 3D with a 2D fallback for mobile and low-power devices:**
- Show the full 3D experience on capable desktops
- Show the simple 2D `PlainView` on: phones and small viewports, no WebGL support, `prefers-reduced-data`, very low-end hardware (low `hardwareConcurrency` / `deviceMemory`), or after sustained low FPS
- The 2D view is a clean, fast, single-page scrolling layout with the same content from `content.ts`, a static or CSS-animated starfield background, and the same contact form
- Include a visible **"Switch to simple view / Switch to 3D view"** toggle on desktop so any recruiter can bypass the 3D if they want
- Both views share the same data and components where possible, no duplicated content

**Load performance:** compress textures (KTX2 or reasonably sized JPG/WebP), lazy-load heavy assets, cap DPR at 2, use instancing for asteroids and stars, dispose of resources properly, avoid re-renders in the render loop.

**Accessibility:**
- Respect `prefers-reduced-motion`: skip the intro, replace camera flights with quick fades, disable spaceship cursor, shooting stars, and chromatic aberration
- All panel content is real DOM text (not drawn in the canvas), with proper headings and landmarks
- Focus is moved into the panel when it opens and returned to the planet/nav when it closes
- Color contrast in the panel meets WCAG AA
- Every interactive element has an accessible name

**SEO and sharing:** proper title, meta description, Open Graph and Twitter tags, favicon, and a `<noscript>` message. The 2D content should be crawlable.

---

## 9. Deployment

- Deploy on Vercel. Include a `vercel.json` only if needed.
- Document required environment variables in `.env.example` and the README, and remind me to add them in the Vercel dashboard before the first production deploy (`RESEND_API_KEY`, `CONTACT_TO_EMAIL`)
- README must cover: local dev, how to edit content, how to add/replace textures, how to configure the contact form, and how to deploy

---

## 10. Build Phases (commit after each)

1. **Scaffold:** Vite + React + TS, Tailwind, R3F, zustand, folder structure, empty scene with starfield and nebula. Before the first commit, confirm `.gitignore` covers `.env*` (except `.env.example`), `node_modules`, `dist`, `.vercel`, and `/source-textures/`. Create `.env.example` with blank `RESEND_API_KEY` and `CONTACT_TO_EMAIL`.
2. **Solar system:** Sun with bloom, all planets with textures/materials, orbits, moons, rings, atmosphere shaders, lighting
3. **Navigation:** camera rig with fly-to and back, hover tooltips and glow, keyboard support, zustand wiring
4. **Content panel and sections:** sliding panel, all six sections built against placeholder data in `content.ts`
5. **Contact system:** form UI, `/api/contact` with Resend, validation, honeypot, rate limiting, social links plus Mercury satellites
6. **Extras:** loading and intro sequence, spaceship cursor, asteroid belt, shooting stars, Planet X and Konami, minimap, console message
7. **Fallback and performance:** quality tiers, PerformanceMonitor, 2D `PlainView`, view toggle, reduced-motion handling
8. **Polish and ship:** accessibility pass, SEO tags, README, credits, Lighthouse check, Vercel deploy

At the start, propose a short plan and list anything you need from me (textures, content, API keys) before you begin phase 1. Ask questions rather than guessing whenever something in this spec is ambiguous.

---

## 11. Definition of Done

- Opening scene loads with the cinematic intro and skip button
- Every planet is hoverable, clickable, keyboard reachable, and flies the camera correctly
- All six sections render from `content.ts`, and Planet X is discoverable
- Contact form successfully delivers an email to me on the deployed site
- Mobile and low-power devices get the fast 2D view, and desktop users can toggle between views
- Smooth performance on a typical laptop, and no console errors
- Deployed on Vercel with a working README
