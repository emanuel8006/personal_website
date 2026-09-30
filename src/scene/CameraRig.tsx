import { CameraControls } from '@react-three/drei'

/**
 * Phase 1 placeholder: free-look controls so the backdrop can be inspected.
 * Phase 3 replaces this with the fly-to / back-to-overview rig.
 */
export default function CameraRig() {
  return <CameraControls makeDefault minDistance={20} maxDistance={400} smoothTime={0.6} />
}
