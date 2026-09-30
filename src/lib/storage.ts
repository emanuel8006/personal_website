/**
 * Web Storage can be missing or throw (private windows, blocked site data,
 * previews), so every access is guarded and failures are ignored.
 */
type Kind = 'local' | 'session'

const store = (kind: Kind): Storage | null => {
  try {
    return kind === 'local' ? window.localStorage : window.sessionStorage
  } catch {
    return null
  }
}

export function readFlag(kind: Kind, key: string): boolean {
  try {
    return store(kind)?.getItem(key) === '1'
  } catch {
    return false
  }
}

export function writeFlag(kind: Kind, key: string) {
  try {
    store(kind)?.setItem(key, '1')
  } catch {
    // ignore: the feature just won't persist
  }
}
