import { useThree } from '@react-three/fiber'
import { useEffect } from 'react'
import { useAppStore } from '../store'
import { bodyRegistry, flight } from './registry'

/** Dev only: exposes scene internals on window.__portfolio for automated browser checks. */
export default function DevHandle() {
  const camera = useThree((s) => s.camera)
  const size = useThree((s) => s.size)
  useEffect(() => {
    Object.assign(window, { __portfolio: { camera, size, bodyRegistry, flight, store: useAppStore } })
  }, [camera, size])
  return null
}
