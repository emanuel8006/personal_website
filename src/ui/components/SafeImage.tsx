import { useState, type ImgHTMLAttributes, type ReactNode } from 'react'

/**
 * <img> that swaps to `fallback` if the file fails to load, so visitors never
 * see a broken-image icon. The fallback should carry the same accessible name
 * (e.g. role="img" + aria-label={alt}).
 */
export default function SafeImage({
  fallback,
  alt,
  ...props
}: ImgHTMLAttributes<HTMLImageElement> & { alt: string; fallback: ReactNode }) {
  const [failed, setFailed] = useState(false)
  if (failed) return <>{fallback}</>
  return <img alt={alt} {...props} onError={() => setFailed(true)} />
}
