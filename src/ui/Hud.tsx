import { motion } from 'framer-motion'
import { SITE } from '../data/content'
import { useKeyboardNav } from '../hooks/useKeyboardNav'
import { useKonami } from '../hooks/useKonami'
import { useAppStore } from '../store'
import BackButton from './BackButton'
import ContentPanel from './ContentPanel'
import Minimap from './Minimap'
import Nav from './Nav'
import Tooltip from './Tooltip'

/** DOM overlay above the canvas. Only interactive children receive pointer events. */
export default function Hud() {
  useKeyboardNav()
  const discoverPlanetX = useAppStore((s) => s.discoverPlanetX)
  useKonami(discoverPlanetX)

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
        <header className="flex flex-col items-start gap-3 p-4 sm:p-6">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <p
              className="font-display text-sm font-semibold tracking-[0.3em] text-white/90 uppercase"
              aria-hidden="true"
            >
              <span className="text-sun">{SITE.initials}</span>
            </p>
            <Nav />
          </div>
          <BackButton />
        </header>
        <div className="absolute bottom-4 left-4 hidden md:block sm:bottom-6 sm:left-6">
          <Minimap />
        </div>
      </motion.div>
      <ContentPanel />
      <Tooltip />
    </div>
  )
}
