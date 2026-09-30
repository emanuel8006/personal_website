import { CameraControls } from '@react-three/drei'
import { useEffect, useRef } from 'react'

/**
 * Phase 1–2 placeholder: free-look controls so the scene can be inspected.
 * Phase 3 replaces this with the fly-to / back-to-overview rig.
 *
 * Dev only: ?cam=x,y,z&look=x,y,z sets the initial view (for screenshots).
 */
export default function CameraRig() {
  const controls = useRef<CameraControls>(null)

  useEffect(() => {
    if (!import.meta.env.DEV) return
    const params = new URLSearchParams(location.search)
    const cam = params.get('cam')?.split(',').map(Number)
    const look = params.get('look')?.split(',').map(Number) ?? [0, 0, 0]
    if (cam?.length === 3) controls.current?.setLookAt(cam[0], cam[1], cam[2], look[0], look[1], look[2], false)
  }, [])

  return <CameraControls ref={controls} makeDefault minDistance={2} maxDistance={400} smoothTime={0.6} />
}
