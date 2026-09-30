import { SITE } from '../data/content'
import { useKeyboardNav } from '../hooks/useKeyboardNav'
import BackButton from './BackButton'
import Nav from './Nav'
import Tooltip from './Tooltip'

/** DOM overlay above the canvas. Only interactive children receive pointer events. */
export default function Hud() {
  useKeyboardNav()

  return (
    <div className="pointer-events-none fixed inset-0 z-20">
      <header className="flex flex-col items-start gap-3 p-4 sm:p-6">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <p className="font-display text-sm font-semibold tracking-[0.3em] text-white/90 uppercase">
            <span className="text-sun">{SITE.initials}</span>
            <span className="sr-only">{SITE.name}</span>
          </p>
          <Nav />
        </div>
        <BackButton />
      </header>
      <Tooltip />
    </div>
  )
}
