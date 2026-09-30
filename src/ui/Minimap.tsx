import { useCallback, useEffect, useRef, useState } from 'react'
import { SECTIONS } from '../data/content'
import { PLANETS } from '../scene/bodies'
import { bodyRegistry } from '../scene/registry'
import { availableSections, useAppStore, type SectionId } from '../store'

const SIZE = 168
const PAD = 12
const DOT_COLORS: Record<SectionId, string> = {
  about: '#ffb347',
  contact: '#b8b2a8',
  education: '#5aa9ff',
  experience: '#e0663a',
  projects: '#e2c89f',
  skills: '#f0dca8',
  personal: '#8aa8ff',
}

/**
 * Top-down orbit tracker.
 *
 * Accessibility note: the dots are 24px targets but move, so two can briefly
 * overlap. WCAG 2.5.8 (Target Size) is still met via its "equivalent control"
 * exception: every dot's action is also in the text nav, whose targets comply. Dots follow the live planet positions (updated per
 * animation frame via refs, no React re-renders). Every dot is a real button,
 * so it doubles as accessible navigation.
 */
export default function Minimap() {
  const section = useAppStore((s) => s.section)
  const planetXFound = useAppStore((s) => s.planetXFound)
  const openSection = useAppStore((s) => s.openSection)
  const setHovered = useAppStore((s) => s.setHovered)
  const [label, setLabel] = useState<SectionId | null>(null)
  const dots = useRef<Partial<Record<SectionId, HTMLButtonElement | null>>>({})

  const ids = availableSections(planetXFound)
  const maxOrbit = planetXFound ? PLANETS.personal.orbitRadius : PLANETS.skills.orbitRadius + 10
  const c = SIZE / 2
  // Square-root radial scale: spreads the crowded inner orbits so dots (24px targets) rarely overlap
  const R = SIZE / 2 - PAD
  const radius = useCallback((r: number) => Math.sqrt(r / maxOrbit) * R, [maxOrbit, R])

  useEffect(() => {
    let raf = 0
    const tick = () => {
      for (const [id, el] of Object.entries(dots.current) as [SectionId, HTMLButtonElement | null][]) {
        const entry = bodyRegistry.get(id)
        if (!el || !entry) continue
        const { x, z } = entry.object.position
        const d = Math.hypot(x, z)
        const k = d > 1e-6 ? radius(d) / d : 0
        el.style.transform = `translate(${c + x * k}px, ${c + z * k}px) translate(-50%, -50%)`
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [c, radius])

  const orbits = (Object.values(PLANETS) as (typeof PLANETS)[keyof typeof PLANETS][]).filter(
    (p) => p.id !== 'personal' || planetXFound,
  )

  return (
    <nav
      aria-label="Orbit tracker"
      className="pointer-events-auto relative rounded-2xl border border-white/10 bg-space/55 p-2 backdrop-blur-md"
    >
      <div className="flex items-center justify-between px-1.5 pb-1">
        <p className="font-mono text-[10px] tracking-[0.22em] text-slate-400 uppercase" aria-hidden="true">
          Orbit tracker
        </p>
        <p className="h-3 font-mono text-[10px] tracking-[0.12em] text-cyan uppercase" aria-hidden="true">
          {label ? SECTIONS[label].label : ''}
        </p>
      </div>
      <div className="relative" style={{ width: SIZE, height: SIZE }}>
        <svg width={SIZE} height={SIZE} aria-hidden="true" className="absolute inset-0">
          <defs>
            <radialGradient id="mm-sun">
              <stop offset="0" stopColor="#ffd08a" />
              <stop offset="1" stopColor="#ff7a18" stopOpacity="0" />
            </radialGradient>
          </defs>
          {/* Asteroid belt */}
          <circle
            cx={c}
            cy={c}
            r={(radius(56) + radius(68)) / 2}
            fill="none"
            stroke="rgba(180,170,150,0.18)"
            strokeWidth={radius(68) - radius(56)}
            strokeDasharray="1 2"
          />
          {orbits.map((p) => (
            <circle
              key={p.id}
              cx={c}
              cy={c}
              r={radius(p.orbitRadius)}
              fill="none"
              stroke={section === p.id ? 'rgba(94,231,255,0.55)' : 'rgba(143,216,255,0.16)'}
              strokeWidth={1}
            />
          ))}
          <circle cx={c} cy={c} r={9} fill="url(#mm-sun)" />
        </svg>
        {ids.map((id) => {
          const active = section === id
          const isSun = id === 'about'
          return (
            <button
              key={id}
              type="button"
              ref={(el) => {
                dots.current[id] = el
              }}
              onClick={() => openSection(id)}
              onMouseEnter={() => {
                setLabel(id)
                setHovered(id)
              }}
              onMouseLeave={() => {
                setLabel(null)
                setHovered(null)
              }}
              onFocus={() => setLabel(id)}
              onBlur={() => setLabel(null)}
              aria-label={`${SECTIONS[id].label} (${SECTIONS[id].body})`}
              aria-current={active ? 'true' : undefined}
              className="group absolute top-0 left-0 grid h-6 w-6 place-items-center rounded-full focus-visible:ring-2 focus-visible:ring-cyan focus-visible:outline-none"
              style={{ transform: `translate(${c}px, ${c}px) translate(-50%, -50%)` }}
            >
              <span
                className={`block rounded-full transition-transform group-hover:scale-150 ${isSun ? 'h-3 w-3' : 'h-2 w-2'} ${
                  active ? 'ring-2 ring-cyan ring-offset-2 ring-offset-space' : ''
                }`}
                style={{ background: DOT_COLORS[id], boxShadow: `0 0 8px ${DOT_COLORS[id]}` }}
              />
            </button>
          )
        })}
      </div>
    </nav>
  )
}
