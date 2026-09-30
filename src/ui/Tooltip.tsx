import { AnimatePresence, motion } from 'framer-motion'
import { CONTACT, PROJECTS, SECTIONS } from '../data/content'
import { useAppStore } from '../store'
import { hud } from './hudRefs'

function useTooltipContent() {
  const hovered = useAppStore((s) => s.hovered)
  const hoveredProject = useAppStore((s) => s.hoveredProject)
  const hoveredSocial = useAppStore((s) => s.hoveredSocial)
  const section = useAppStore((s) => s.section)

  if (hoveredSocial) {
    const link = CONTACT.socials.find((x) => x.href === hoveredSocial)
    const where = link ? link.href.replace(/^(https?:\/\/|mailto:)(www\.)?/, '').replace(/\/$/, '') : ''
    return link
      ? { key: `sat:${link.href}`, eyebrow: 'Satellite of Mercury · Contact', title: link.label, line: where }
      : null
  }

  if (hoveredProject) {
    // Card hovered inside the open Projects panel: the moon glows, no tooltip needed
    if (section === 'projects') return null
    const p = PROJECTS.find((x) => x.id === hoveredProject)
    return p ? { key: `moon:${p.id}`, eyebrow: 'Moon of Jupiter · Project', title: p.title, line: p.pitch } : null
  }
  if (hovered && hovered !== section) {
    const m = SECTIONS[hovered]
    return { key: hovered, eyebrow: `${m.body} · ${m.label}`, title: null, line: m.teaser }
  }
  return null
}

/**
 * Hover label for bodies and project moons. The outer element is positioned
 * every frame by the scene's HoverTracker; the inner card animates in/out.
 */
export default function Tooltip() {
  const content = useTooltipContent()

  return (
    <div
      ref={(el) => {
        hud.tooltip = el
      }}
      className="pointer-events-none fixed top-0 left-0 z-30"
      aria-hidden="true" // same text is exposed on the nav buttons / project cards
    >
      <AnimatePresence>
        {content && (
          <motion.div
            key={content.key}
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -4 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="w-max max-w-64 rounded-md border border-cyan/25 bg-space/70 px-3 py-2 shadow-[0_0_24px_-6px_rgba(94,231,255,0.35)] backdrop-blur-md"
          >
            <p className="font-mono text-[10px] tracking-[0.22em] text-cyan uppercase">{content.eyebrow}</p>
            {content.title && <p className="mt-0.5 font-display text-sm font-semibold text-white">{content.title}</p>}
            <p className="mt-0.5 font-mono text-xs text-slate-200">{content.line}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
