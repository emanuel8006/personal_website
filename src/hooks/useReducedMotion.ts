import { useSyncExternalStore } from 'react'

const QUERY = '(prefers-reduced-motion: reduce)'
const mql = typeof window !== 'undefined' ? window.matchMedia(QUERY) : null

function subscribe(onChange: () => void) {
  mql?.addEventListener('change', onChange)
  return () => mql?.removeEventListener('change', onChange)
}

/** Non-hook read, cheap enough for per-frame code in the scene. */
export function prefersReducedMotion() {
  return mql?.matches ?? false
}

export function useReducedMotion() {
  return useSyncExternalStore(subscribe, prefersReducedMotion, () => false)
}
