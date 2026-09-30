import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useRef } from 'react'
import { SECTIONS } from '../data/content'
import { useReducedMotion } from '../hooks/useReducedMotion'
import { availableSections, useAppStore, type SectionId } from '../store'
import { Icon } from './components/icons'
import { SECTION_COMPONENTS } from './sections'

const EASE_OUT = [0.22, 1, 0.36, 1] as const
const EASE_IN = [0.4, 0, 1, 1] as const
/** Let the camera flight get going before the panel arrives. */
const ENTER_DELAY = 0.35

const iconButton =
  'grid h-9 w-9 place-items-center rounded-full border border-white/12 bg-white/5 text-slate-200 transition hover:border-cyan/50 hover:text-white focus-visible:ring-2 focus-visible:ring-cyan focus-visible:outline-none'

function PanelHeader({ section }: { section: SectionId }) {
  const planetXFound = useAppStore((s) => s.planetXFound)
  const stepSection = useAppStore((s) => s.stepSection)
  const closeSection = useAppStore((s) => s.closeSection)
  const heading = useRef<HTMLHeadingElement>(null)

  const list = availableSections(planetXFound)
  const index = list.indexOf(section)
  const prev = list[(index - 1 + list.length) % list.length]
  const next = list[(index + 1) % list.length]
  const meta = SECTIONS[section]

  // Move focus into the panel whenever it opens or changes section
  useEffect(() => {
    heading.current?.focus({ preventScroll: true })
  }, [section])

  return (
    <header className="flex items-start justify-between gap-4 border-b border-white/8 px-6 pt-6 pb-5 md:px-8">
      <div className="min-w-0">
        <p className="font-mono text-[11px] tracking-[0.22em] text-cyan uppercase">
          {section === 'personal' ? 'X' : String(index + 1).padStart(2, '0')} / {String(list.length).padStart(2, '0')}
          <span className="text-slate-400"> · </span>
          {meta.body}
        </p>
        <h2
          id="panel-title"
          ref={heading}
          tabIndex={-1}
          className="mt-1 font-display text-3xl font-semibold text-white focus:outline-none"
        >
          {meta.label}
        </h2>
      </div>
      <div className="flex shrink-0 items-center gap-1.5">
        <button
          type="button"
          onClick={() => stepSection(-1)}
          className={iconButton}
          aria-label={`Previous: ${SECTIONS[prev].label}`}
        >
          <Icon name="chevronLeft" />
        </button>
        <button
          type="button"
          onClick={() => stepSection(1)}
          className={iconButton}
          aria-label={`Next: ${SECTIONS[next].label}`}
        >
          <Icon name="chevronRight" />
        </button>
        <button
          type="button"
          onClick={closeSection}
          className={iconButton}
          aria-label="Close panel and return to the solar system"
        >
          <Icon name="close" />
        </button>
      </div>
    </header>
  )
}

/**
 * Glass content panel that slides in from the right while a section is open.
 * Real DOM text (not canvas), so it's readable, selectable, and accessible.
 */
export default function ContentPanel() {
  const section = useAppStore((s) => s.section)
  const openSection = useAppStore((s) => s.openSection)
  const reduced = useReducedMotion()
  const scroller = useRef<HTMLDivElement>(null)
  const lastSection = useRef<SectionId | null>(null)

  useEffect(() => {
    if (section) {
      scroller.current?.scrollTo({ top: 0 })
    } else if (lastSection.current) {
      // Closed: return focus to the nav item for the section we just left
      document.querySelector<HTMLElement>(`[data-nav-section="${lastSection.current}"]`)?.focus({ preventScroll: true })
    }
    lastSection.current = section
  }, [section])

  const Body = section ? SECTION_COMPONENTS[section] : null

  return (
    <AnimatePresence>
      {section && Body && (
        <motion.aside
          key="panel"
          aria-labelledby="panel-title"
          initial={reduced ? { opacity: 0 } : { x: '105%' }}
          animate={{
            x: 0,
            opacity: 1,
            transition: reduced ? { duration: 0.2 } : { delay: ENTER_DELAY, duration: 0.7, ease: EASE_OUT },
          }}
          exit={
            reduced
              ? { opacity: 0, transition: { duration: 0.15 } }
              : { x: '105%', transition: { duration: 0.45, ease: EASE_IN } }
          }
          className="pointer-events-auto fixed inset-y-0 right-0 z-20 flex w-full md:w-[45vw] md:max-w-[760px] md:min-w-[440px] md:py-4 md:pr-4"
        >
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden border-cyan/20 bg-[#070a1c]/80 shadow-[inset_0_1px_0_rgba(255,255,255,0.07),0_0_70px_-24px_rgba(94,231,255,0.45)] backdrop-blur-2xl md:rounded-3xl md:border">
            <PanelHeader section={section} />
            <div ref={scroller} className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 pt-6 pb-12 md:px-8">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={section}
                  initial={{ opacity: 0, y: reduced ? 0 : 10 }}
                  animate={{ opacity: 1, y: 0, transition: { duration: 0.35, ease: EASE_OUT } }}
                  exit={{ opacity: 0, transition: { duration: 0.15 } }}
                >
                  <Body onNavigate={openSection} variant="panel" />
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  )
}
