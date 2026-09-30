import { useFrame } from '@react-three/fiber'
import { easing } from 'maath'
import { useAppStore } from '../store'
import { JUPITER_MOONS_PLACEHOLDER, PLANETS } from './bodies'
import Earth from './Earth'
import Planet, { Moon, OrbitLine } from './Planet'
import { simulation } from './registry'
import Saturn from './Saturn'
import Sun from './Sun'

function OrbitClock() {
  useFrame((_, dt) => {
    easing.damp(simulation, 'orbitSpeed', simulation.orbitSpeedTarget, 0.6, dt)
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
      <Planet config={PLANETS.contact} />

      <OrbitLine radius={PLANETS.education.orbitRadius} />
      <Earth />

      <OrbitLine radius={PLANETS.experience.orbitRadius} />
      <Planet config={PLANETS.experience} />

      <OrbitLine radius={PLANETS.projects.orbitRadius} />
      <Planet config={PLANETS.projects}>
        {JUPITER_MOONS_PLACEHOLDER.map((moon, i) => (
          <Moon key={i} config={moon} />
        ))}
      </Planet>

      <OrbitLine radius={PLANETS.skills.orbitRadius} />
      <Saturn />

      {planetXFound && (
        <>
          <OrbitLine radius={PLANETS.personal.orbitRadius} opacity={0.08} />
          <Planet config={PLANETS.personal} />
        </>
      )}
    </>
  )
}
