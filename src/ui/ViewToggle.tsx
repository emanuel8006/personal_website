import { useAppStore } from '../store'

const pill =
  'inline-flex items-center gap-2 rounded-full border border-white/15 bg-space/60 px-3 py-1.5 font-mono text-[11px] tracking-[0.14em] text-slate-200 uppercase backdrop-blur-md transition-colors hover:border-cyan/50 hover:text-white focus-visible:ring-2 focus-visible:ring-cyan focus-visible:outline-none'

/** "Switch to simple view / Switch to 3D view": lets anyone bypass the 3D. */
export default function ViewToggle() {
  const viewMode = useAppStore((s) => s.viewMode)
  const can3D = useAppStore((s) => s.can3D)
  const setViewMode = useAppStore((s) => s.setViewMode)

  if (viewMode === '3d') {
    return (
      <button type="button" className={`pointer-events-auto ${pill}`} onClick={() => setViewMode('2d')}>
        <span aria-hidden="true">▤</span> Switch to simple view
      </button>
    )
  }
  if (!can3D) return null // phones / no WebGL: 2D is the only option
  return (
    <button type="button" className={pill} onClick={() => setViewMode('3d')}>
      <span aria-hidden="true">✦</span> Switch to 3D view
    </button>
  )
}
