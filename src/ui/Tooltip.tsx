import { AnimatePresence, motion } from 'framer-motion'
import { SECTIONS } from '../data/content'
import { useAppStore } from '../store'
import { hud } from './hudRefs'

/**
 * Hover label for bodies. The outer element is positioned every frame by
 * the scene's HoverTracker; the inner card animates in/out.
 */
export default function Tooltip() {
  const hovered = useAppStore((s) => s.hovered)
  const section = useAppStore((s) => s.section)
  const id = hovered && hovered !== section ? hovered : null

  return (
    <div
      ref={(el) => {
        hud.tooltip = el
      }}
      className="pointer-events-none fixed top-0 left-0 z-30"
      aria-hidden="true" // same text is exposed on the nav buttons
    >
      <AnimatePresence>
        {id && (
          <motion.div
            key={id}
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -4 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="w-max max-w-64 rounded-md border border-cyan/25 bg-space/70 px-3 py-2 shadow-[0_0_24px_-6px_rgba(94,231,255,0.35)] backdrop-blur-md"
          >
            <p className="font-mono text-[10px] tracking-[0.22em] text-cyan uppercase">
              {SECTIONS[id].body} · {SECTIONS[id].label}
            </p>
            <p className="mt-0.5 font-mono text-xs text-slate-200">{SECTIONS[id].teaser}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
