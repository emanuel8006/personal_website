import { useEffect } from 'react'
import { isEditable } from './useKeyboardNav'

const SEQUENCE = [
  'ArrowUp',
  'ArrowUp',
  'ArrowDown',
  'ArrowDown',
  'ArrowLeft',
  'ArrowRight',
  'ArrowLeft',
  'ArrowRight',
  'b',
  'a',
]

/** Calls `onUnlock` when the Konami code is typed (ignored while typing in a field). */
export function useKonami(onUnlock: () => void) {
  useEffect(() => {
    let index = 0
    const onKey = (e: KeyboardEvent) => {
      if (isEditable(e.target)) return
      const key = e.key.length === 1 ? e.key.toLowerCase() : e.key
      if (key === SEQUENCE[index]) {
        index++
        if (index === SEQUENCE.length) {
          index = 0
          onUnlock()
        }
      } else {
        index = key === SEQUENCE[0] ? 1 : 0
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onUnlock])
}
