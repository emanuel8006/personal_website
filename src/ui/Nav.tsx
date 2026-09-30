import { SECTIONS } from '../data/content'
import { availableSections, useAppStore } from '../store'

/**
 * Plain-text section nav. Doubles as the keyboard path to every planet:
 * focusing an item highlights its body (glow + tooltip), Enter flies there.
 */
export default function Nav() {
  const section = useAppStore((s) => s.section)
  const planetXFound = useAppStore((s) => s.planetXFound)
  const openSection = useAppStore((s) => s.openSection)
  const setHovered = useAppStore((s) => s.setHovered)

  return (
    <nav aria-label="Portfolio sections" className="pointer-events-auto">
      <ul className="flex flex-wrap items-center gap-x-1 gap-y-1">
        {availableSections(planetXFound).map((id) => {
          const active = section === id
          return (
            <li key={id}>
              <button
                type="button"
                onClick={() => openSection(id)}
                onMouseEnter={() => setHovered(id)}
                onMouseLeave={() => setHovered(null)}
                onFocus={() => setHovered(id)}
                onBlur={() => setHovered(null)}
                aria-current={active ? 'true' : undefined}
                className={`rounded px-2 py-1 font-mono text-[11px] tracking-[0.18em] uppercase transition-colors focus-visible:ring-2 focus-visible:ring-cyan focus-visible:outline-none ${
                  active ? 'text-cyan' : 'text-slate-300 hover:text-white'
                }`}
              >
                {SECTIONS[id].label}
                <span className="sr-only">
                  {' '}
                  ({SECTIONS[id].body}: {SECTIONS[id].teaser})
                </span>
              </button>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
