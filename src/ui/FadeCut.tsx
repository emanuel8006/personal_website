import { hud } from './hudRefs'

/** Black layer the camera rig fades through (reduced motion) instead of flying. */
export default function FadeCut() {
  return (
    <div
      ref={(el) => {
        hud.fade = el
      }}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[45] bg-black opacity-0"
    />
  )
}
