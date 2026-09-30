import { useMemo } from 'react'

/** Deterministic PRNG so the star pattern is identical on every visit (and in SSR/prerender). */
function mulberry32(seed: number) {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const FIELD = 2000 // px: each layer tiles vertically every FIELD px

/** One layer of stars drawn as box-shadows on a 1px element (a single DOM node per layer). */
function starShadows(count: number, seed: number, size: number, alpha: number) {
  const rand = mulberry32(seed)
  const shadows: string[] = []
  for (let i = 0; i < count; i++) {
    const x = Math.round(rand() * 2400)
    const y = Math.round(rand() * FIELD)
    const tint = rand() < 0.15 ? '255,214,170' : rand() < 0.3 ? '180,220,255' : '255,255,255'
    const a = (alpha * (0.5 + rand() * 0.5)).toFixed(2)
    shadows.push(`${x}px ${y}px 0 ${size > 1 ? (size - 1) / 2 : 0}px rgba(${tint},${a})`)
  }
  return shadows.join(',')
}

const LAYERS = [
  { count: 260, seed: 1, size: 1, alpha: 0.55, duration: 240 },
  { count: 110, seed: 2, size: 2, alpha: 0.7, duration: 170 },
  { count: 40, seed: 3, size: 3, alpha: 0.85, duration: 120 },
]

/**
 * Lightweight 2D backdrop: three parallax star layers (pure CSS box-shadows,
 * slowly drifting; static for reduced motion) over a soft nebula gradient.
 */
export default function StarfieldBackground() {
  // Prerender (no window): skip the star layers; they're decoration and would add ~35 KB of inline styles
  const layers = useMemo(
    () =>
      typeof window === 'undefined'
        ? []
        : LAYERS.map((l) => ({ ...l, shadow: starShadows(l.count, l.seed, l.size, l.alpha) })),
    [],
  )

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-space">
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(60% 45% at 85% 5%, rgba(255,160,70,0.16), transparent 70%),' +
            'radial-gradient(55% 50% at 10% 30%, rgba(90,50,170,0.22), transparent 70%),' +
            'radial-gradient(50% 45% at 70% 85%, rgba(20,110,150,0.18), transparent 70%)',
        }}
      />
      {layers.map((l) => (
        <div key={l.seed} className="star-drift absolute top-0 left-0" style={{ animationDuration: `${l.duration}s` }}>
          {/* two stacked copies so the drift loops seamlessly */}
          <div className="h-px w-px" style={{ boxShadow: l.shadow }} />
          <div className="h-px w-px" style={{ boxShadow: l.shadow, transform: `translateY(${FIELD}px)` }} />
        </div>
      ))}
    </div>
  )
}
