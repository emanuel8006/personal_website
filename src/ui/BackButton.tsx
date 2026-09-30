import { AnimatePresence, motion } from 'framer-motion'
import { useAppStore } from '../store'

/** "Back to Solar System": visible whenever a section is open (Escape does the same). */
export default function BackButton() {
  const section = useAppStore((s) => s.section)
  const closeSection = useAppStore((s) => s.closeSection)

  return (
    <AnimatePresence>
      {section && (
        <motion.button
          type="button"
          onClick={closeSection}
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.2 }}
          className="pointer-events-auto inline-flex items-center gap-2 rounded-full border border-cyan/30 bg-space/60 px-4 py-2 font-mono text-xs tracking-[0.14em] text-slate-100 uppercase backdrop-blur-md transition-colors hover:border-cyan/60 hover:text-white focus-visible:ring-2 focus-visible:ring-cyan focus-visible:outline-none"
        >
          <span aria-hidden="true">←</span> Back to Solar System
          <kbd className="ml-1 rounded border border-slate-500/50 px-1 text-[10px] text-slate-400">Esc</kbd>
        </motion.button>
      )}
    </AnimatePresence>
  )
}
