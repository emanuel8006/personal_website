import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { ABOUT, SITE } from '../data/content'
import { useAppStore } from '../store'

/** After this long, offer the simple view (slow connection or GPU). */
const SLOW_LOAD_MS = 6000

function Loader({ progress }: { progress: number }) {
  const pct = Math.round(progress)
  const setViewMode = useAppStore((s) => s.setViewMode)
  const [slow, setSlow] = useState(false)
  useEffect(() => {
    const timer = window.setTimeout(() => setSlow(true), SLOW_LOAD_MS)
    return () => window.clearTimeout(timer)
  }, [])

  return (
    <div className="w-64 text-center">
      <p className="font-mono text-[11px] tracking-[0.32em] text-slate-400 uppercase">Charting the system</p>
      <div
        role="progressbar"
        aria-label="Loading the solar system"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pct}
        className="mt-4 h-px w-full overflow-hidden bg-white/10"
      >
        <div
          className="h-full bg-gradient-to-r from-cyan via-violet to-sun shadow-[0_0_12px_rgba(94,231,255,0.8)] transition-[width] duration-300 ease-out"
          style={{ width: `${Math.max(2, pct)}%` }}
        />
      </div>
      <p className="mt-3 font-mono text-xs text-slate-400 tabular-nums" aria-hidden="true">
        {String(pct).padStart(3, '0')}%
      </p>
      <button
        type="button"
        onClick={() => setViewMode('2d')}
        className={`mt-8 font-mono text-[11px] tracking-[0.12em] text-slate-400 underline-offset-4 transition-opacity duration-700 hover:text-white hover:underline focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-cyan focus-visible:outline-none ${
          slow ? 'opacity-100' : 'opacity-0'
        }`}
      >
        Taking a while? Switch to the simple view
      </button>
    </div>
  )
}

/**
 * Loading screen + cinematic intro. Black screen with a real progress bar;
 * once loaded it fades out while the camera cranes back from the Sun and the
 * name/tagline fade in. "Skip intro" is always available during the full intro.
 */
export default function IntroOverlay() {
  const intro = useAppStore((s) => s.intro)
  const introMode = useAppStore((s) => s.introMode)
  const progress = useAppStore((s) => s.loadProgress)
  const skipIntro = useAppStore((s) => s.skipIntro)
  const full = introMode === 'full'

  return (
    <>
      <AnimatePresence>
        {intro === 'loading' && (
          <motion.div
            key="curtain"
            className="fixed inset-0 z-50 grid place-items-center bg-black"
            exit={{ opacity: 0, transition: { duration: full ? 1.8 : 0.7, ease: 'easeInOut' } }}
          >
            <Loader progress={progress} />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {intro === 'playing' && (
          <motion.div
            key="title"
            className="pointer-events-none fixed inset-x-0 bottom-[16%] z-40 px-6 text-center"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0, transition: { delay: 1.1, duration: 1.4, ease: [0.22, 1, 0.36, 1] } }}
            exit={{ opacity: 0, y: -6, transition: { duration: 0.8 } }}
          >
            <p className="font-display text-4xl font-semibold tracking-tight text-white drop-shadow-[0_2px_24px_rgba(0,0,0,0.9)] sm:text-6xl">
              {SITE.name}
            </p>
            <p className="mx-auto mt-3 max-w-xl text-base text-amber-100/90 drop-shadow-[0_1px_12px_rgba(0,0,0,0.9)] sm:text-lg">
              {ABOUT.tagline}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {full && intro !== 'done' && (
          <motion.button
            key="skip"
            type="button"
            onClick={skipIntro}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { delay: 0.3 } }}
            exit={{ opacity: 0, transition: { duration: 0.3 } }}
            className="fixed right-5 bottom-5 z-[60] inline-flex items-center gap-2 rounded-full border border-white/20 bg-black/40 px-4 py-2 font-mono text-xs tracking-[0.16em] text-slate-200 uppercase backdrop-blur-md transition-colors hover:border-cyan/60 hover:text-white focus-visible:ring-2 focus-visible:ring-cyan focus-visible:outline-none"
          >
            Skip intro <span aria-hidden="true">→</span>
          </motion.button>
        )}
      </AnimatePresence>
    </>
  )
}
