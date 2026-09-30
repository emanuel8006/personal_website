import { useCallback, useEffect } from 'react'
import { SECTIONS, SITE } from '../data/content'
import { prefersReducedMotion } from '../hooks/useReducedMotion'
import { availableSections, useAppStore, type SectionId } from '../store'
import Credits from '../ui/Credits'
import { SECTION_COMPONENTS } from '../ui/sections'
import ViewToggle from '../ui/ViewToggle'
import StarfieldBackground from './StarfieldBackground'

const YEAR = new Date().getFullYear()

const BODY_INDEX = (id: SectionId, list: SectionId[]) =>
  id === 'personal' ? 'X' : String(list.indexOf(id) + 1).padStart(2, '0')

function scrollToSection(id: SectionId) {
  const el = document.getElementById(id)
  if (!el) return
  el.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'start' })
  // Move focus for keyboard and screen-reader users without a second jump
  el.querySelector<HTMLElement>('h2')?.focus({ preventScroll: true })
}

/**
 * The fast 2D view: one scrolling page with the same content and components
 * as the 3D panel (including the contact form), over a CSS starfield. Used on
 * phones, low-power devices, without WebGL, or when a visitor prefers it.
 */
export default function PlainView() {
  const planetXFound = useAppStore((s) => s.planetXFound)
  const section = useAppStore((s) => s.section)
  const plainTarget = useAppStore((s) => s.plainTarget)
  const list = availableSections(planetXFound)

  // "Open a section" in 2D means scroll to it (nav links, View Projects, Planet X discovery)
  const onNavigate = useCallback((id: SectionId) => useAppStore.getState().openSection(id), [])

  useEffect(() => {
    if (!section) return
    const id = section
    // Wait a frame so a newly revealed section (Planet X) is in the DOM. Not cancelled on
    // cleanup: clearing `section` below re-runs this effect, and the scroll must still happen.
    requestAnimationFrame(() => scrollToSection(id))
    useAppStore.getState().closeSection()
  }, [section])

  // Coming from the 3D view with a panel open: continue at that section
  useEffect(() => {
    if (!plainTarget) return
    const id = plainTarget
    const raf = requestAnimationFrame(() => {
      document.getElementById(id)?.scrollIntoView({ block: 'start' })
      useAppStore.getState().clearPlainTarget()
    })
    return () => cancelAnimationFrame(raf)
  }, [plainTarget])

  return (
    <div className="relative min-h-dvh text-slate-100">
      <StarfieldBackground />
      <a
        href="#main"
        className="sr-only z-50 rounded bg-space px-3 py-2 focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:ring-2 focus:ring-cyan"
      >
        Skip to content
      </a>

      <header className="sticky top-0 z-30 border-b border-white/8 bg-space/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-3 sm:px-6">
          <a href="#about" className="font-display text-sm font-semibold tracking-[0.3em] text-sun uppercase">
            {SITE.initials}
            <span className="sr-only"> ({SITE.name}), back to top</span>
          </a>
          <nav aria-label="Portfolio sections" className="order-3 w-full overflow-x-auto sm:order-none sm:w-auto">
            <ul className="flex gap-1">
              {list.map((id) => (
                <li key={id}>
                  <a
                    href={`#${id}`}
                    onClick={(e) => {
                      e.preventDefault()
                      onNavigate(id)
                    }}
                    className="block rounded px-2 py-1 font-mono text-[11px] tracking-[0.16em] whitespace-nowrap text-slate-300 uppercase transition-colors hover:text-white focus-visible:ring-2 focus-visible:ring-cyan focus-visible:outline-none"
                  >
                    {SECTIONS[id].label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
          <ViewToggle />
        </div>
      </header>

      <main id="main" className="mx-auto max-w-4xl px-4 pb-24 sm:px-6">
        <h1 className="sr-only">{SITE.name}: portfolio</h1>
        {list.map((id) => {
          const Body = SECTION_COMPONENTS[id]
          const hero = id === 'about'
          return (
            <section
              key={id}
              id={id}
              aria-labelledby={`${id}-title`}
              className={`scroll-mt-20 ${hero ? 'pt-12 sm:pt-20' : 'pt-16 sm:pt-24'}`}
            >
              <p className="font-mono text-[11px] tracking-[0.22em] text-cyan uppercase">
                {BODY_INDEX(id, list)} <span className="text-slate-400">·</span> {SECTIONS[id].body}
              </p>
              <h2
                id={`${id}-title`}
                tabIndex={-1}
                className="mt-1 mb-6 font-display text-3xl font-semibold text-white focus:outline-none sm:text-4xl"
              >
                {SECTIONS[id].label}
              </h2>
              <div
                className={hero ? '' : 'rounded-3xl border border-white/10 bg-[#070a1c]/70 p-5 backdrop-blur-md sm:p-8'}
              >
                <Body onNavigate={onNavigate} variant="plain" />
              </div>
            </section>
          )
        })}
      </main>

      <footer className="border-t border-white/8 bg-space/60">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-3 px-4 py-6 font-mono text-xs text-slate-400 sm:px-6">
          <p>
            © {YEAR} {SITE.name}
          </p>
          <Credits />
          {!planetXFound && (
            // The 2D view's easter egg (the Konami code works here too)
            <button
              type="button"
              onClick={() => useAppStore.getState().discoverPlanetX()}
              className="rounded px-1 text-slate-400 transition-colors hover:text-violet focus-visible:ring-2 focus-visible:ring-violet focus-visible:outline-none"
              aria-label="A faint signal. Investigate?"
              title="A faint signal…"
            >
              ✦
            </button>
          )}
        </div>
      </footer>
    </div>
  )
}
