import { useEffect } from 'react'
import { useAppStore } from '../store'

const DURATION_MS = 4500

/**
 * Small celebratory toast (e.g. "You found Planet X"), announced to screen
 * readers. Plain CSS transitions (no animation library) since it ships in both views.
 */
export default function Toast() {
  const toast = useAppStore((s) => s.toast)
  const dismiss = useAppStore((s) => s.dismissToast)

  useEffect(() => {
    if (!toast?.visible) return
    const timer = window.setTimeout(dismiss, DURATION_MS)
    return () => window.clearTimeout(timer)
  }, [toast, dismiss])

  const visible = Boolean(toast?.visible)
  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 top-5 z-40 flex justify-center px-4"
    >
      {toast && (
        <p
          key={toast.id}
          className={`toast-enter rounded-full border border-violet/40 bg-space/80 px-5 py-2.5 font-mono text-sm tracking-[0.12em] text-violet-100 shadow-[0_0_36px_-6px_rgba(167,139,250,0.7)] backdrop-blur-md transition-all duration-300 ${
            visible ? 'translate-y-0 opacity-100' : '-translate-y-2 opacity-0'
          }`}
        >
          <span aria-hidden="true" className="mr-2 text-violet">
            ✦
          </span>
          {visible ? toast.message : ''}
          {!visible && <span aria-hidden="true">{toast.message}</span>}
        </p>
      )}
    </div>
  )
}
