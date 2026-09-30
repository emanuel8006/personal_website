import { motion } from 'framer-motion'
import { SITE } from '../data/content'
import { useKeyboardNav } from '../hooks/useKeyboardNav'
import { useAppStore } from '../store'
import BackButton from './BackButton'
import ContentPanel from './ContentPanel'
import Credits from './Credits'
import Minimap from './Minimap'
import Nav from './Nav'
import Tooltip from './Tooltip'
import ViewToggle from './ViewToggle'

/** DOM overlay above the canvas. Only interactive children receive pointer events. */
export default function Hud() {
  useKeyboardNav()

  // Chrome stays hidden (and out of the tab order) until the intro has played
  const ready = useAppStore((s) => s.intro === 'done')

  return (
    <div className="pointer-events-none fixed inset-0 z-20">
      <h1 className="sr-only">{SITE.name}: portfolio</h1>
      <motion.div
        className="absolute inset-0"
        initial={false}
        animate={{ opacity: ready ? 1 : 0 }}
        transition={{ duration: 0.8, delay: ready ? 0.2 : 0 }}
        inert={!ready}
      >
        {/* Capped to the area left of the content panel (which takes ~45% on the right) so the
            nav wraps instead of sliding underneath it */}
        <header className="flex flex-col items-start gap-3 p-4 sm:p-6 md:max-w-[calc(55vw-1rem)]">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <p
              className="font-display text-sm font-semibold tracking-[0.3em] text-white/90 uppercase"
              aria-hidden="true"
            >
              <span className="text-sun">{SITE.initials}</span>
            </p>
            <Nav />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <BackButton />
            <ViewToggle />
          </div>
        </header>
        <div className="absolute bottom-4 left-4 hidden md:block sm:bottom-6 sm:left-6">
          <Minimap />
        </div>
        <div className="pointer-events-auto absolute right-4 bottom-4 sm:right-6 sm:bottom-6">
          <Credits />
        </div>
      </motion.div>
      <ContentPanel />
      <Tooltip />
    </div>
  )
}
