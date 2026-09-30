import { useFrame } from '@react-three/fiber'
import { easing } from 'maath'
import { useAppStore } from '../store'
import { PLANETS } from './bodies'
import Earth from './Earth'
import Planet, { OrbitLine } from './Planet'
import ProjectMoons from './ProjectMoons'
import { simulation } from './registry'
import Saturn from './Saturn'
import SocialSatellites from './SocialSatellites'
import Sun from './Sun'

function OrbitClock() {
  useFrame((_, dt) => {
    // "Pause motion" (WCAG 2.2.2) stills orbits and all other ambient animation
    const paused = useAppStore.getState().motionPaused
    easing.damp(simulation, 'ambient', paused ? 0 : 1, 0.4, dt)
    easing.damp(simulation, 'orbitSpeed', paused ? 0 : simulation.orbitSpeedTarget, 0.6, dt)
  })
  return null
}

export default function SolarSystem() {
  const planetXFound = useAppStore((s) => s.planetXFound)

  return (
    <>
      <OrbitClock />
      {/* Very low fill so night sides read as dark but not pure black */}
      <ambientLight intensity={0.05} color="#8ea2ff" />

      <Sun />

      <OrbitLine radius={PLANETS.contact.orbitRadius} />
      <Planet config={PLANETS.contact}>
        <SocialSatellites />
      </Planet>

      <OrbitLine radius={PLANETS.education.orbitRadius} />
      <Earth />

      <OrbitLine radius={PLANETS.experience.orbitRadius} />
      <Planet config={PLANETS.experience} />

      <OrbitLine radius={PLANETS.projects.orbitRadius} />
      <Planet config={PLANETS.projects}>
        <ProjectMoons />
      </Planet>

      <OrbitLine radius={PLANETS.skills.orbitRadius} />
      <Saturn />

      {planetXFound && (
        <>
          <OrbitLine radius={PLANETS.personal.orbitRadius} opacity={0.08} />
          <Planet config={PLANETS.personal} appear />
        </>
      )}
    </>
  )
}
