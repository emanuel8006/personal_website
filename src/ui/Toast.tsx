import { AnimatePresence, motion } from 'framer-motion'
import { useEffect } from 'react'
import { useAppStore } from '../store'

const DURATION_MS = 4500

/** Small celebratory toast (e.g. "You found Planet X"), announced to screen readers. */
export default function Toast() {
  const toast = useAppStore((s) => s.toast)
  const dismiss = useAppStore((s) => s.dismissToast)

  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(dismiss, DURATION_MS)
    return () => window.clearTimeout(timer)
  }, [toast, dismiss])

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 top-5 z-40 flex justify-center px-4"
    >
      <AnimatePresence>
        {toast && (
          <motion.p
            key={toast.id}
            initial={{ opacity: 0, y: -12, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="rounded-full border border-violet/40 bg-space/80 px-5 py-2.5 font-mono text-sm tracking-[0.12em] text-violet-100 shadow-[0_0_36px_-6px_rgba(167,139,250,0.7)] backdrop-blur-md"
          >
            <span aria-hidden="true" className="mr-2 text-violet">
              ✦
            </span>
            {toast.message}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  )
}
