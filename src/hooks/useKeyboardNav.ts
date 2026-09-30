import { useEffect } from 'react'
import { useAppStore } from '../store'

/** True when the keystroke belongs to a text field (don't hijack typing). */
export function isEditable(target: EventTarget | null) {
  const el = target as HTMLElement | null
  return !!el && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName))
}

/**
 * Global shortcuts: Escape skips the intro, or closes the open section (or first leaves a
 * focused form field); ←/→ step to the
 * previous/next section while one is open. (↑/↓ stay free for scrolling.)
 */
export function useKeyboardNav() {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey) return
      const { section, closeSection, stepSection, intro, introMode, skipIntro } = useAppStore.getState()
      if (e.key === 'Escape' && intro !== 'done' && introMode === 'full') {
        e.preventDefault()
        skipIntro()
        return
      }
      if (!section) return

      if (e.key === 'Escape') {
        e.preventDefault()
        // In a form field, the first Escape just leaves the field (don't lose a half-written message)
        if (isEditable(e.target)) (e.target as HTMLElement).blur()
        else closeSection()
      } else if ((e.key === 'ArrowRight' || e.key === 'ArrowLeft') && !isEditable(e.target)) {
        e.preventDefault()
        stepSection(e.key === 'ArrowRight' ? 1 : -1)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])
}
