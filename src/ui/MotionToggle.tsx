import { useEffect } from 'react'
import { useAppStore } from '../store'

/**
 * "Pause motion / Resume motion" (WCAG 2.2.2 Pause, Stop, Hide): stills the
 * orbits, spin, twinkle, drift and meteors. Remembered for next visit.
 */
export default function MotionToggle({ className = '' }: { className?: string }) {
  const paused = useAppStore((s) => s.motionPaused)
  const toggle = useAppStore((s) => s.toggleMotion)

  // Also pauses CSS animations (e.g. the 2D view's star drift)
  useEffect(() => {
    document.documentElement.classList.toggle('motion-paused', paused)
  }, [paused])

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={paused}
      className={`inline-flex items-center gap-1.5 font-mono text-[11px] tracking-[0.14em] text-slate-400 uppercase underline-offset-4 transition-colors hover:text-white hover:underline focus-visible:ring-2 focus-visible:ring-cyan focus-visible:outline-none ${className}`}
    >
      <span aria-hidden="true">{paused ? '▶' : '❚❚'}</span>
      {paused ? 'Resume motion' : 'Pause motion'}
    </button>
  )
}
