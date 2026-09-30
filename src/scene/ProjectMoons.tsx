import { useFrame, type ThreeEvent } from '@react-three/fiber'
import { easing } from 'maath'
import { useMemo, useRef } from 'react'
import type { Group } from 'three'
import { PROJECTS, type Project } from '../data/content'
import { useAppStore } from '../store'
import { projectMoonConfig } from './bodies'
import HoverGlow from './HoverGlow'
import { canInteract, type InteractionState } from './interaction'
import { Surface } from './Planet'
import { proceduralSurface } from './procedural'
import { registerMoon, simulation } from './registry'

const CLICK_SLOP = 6

/**
 * A project's moon: orbits Jupiter, glows + shows a tooltip on hover (or while
 * its card is hovered in the panel), and clicking it opens the Projects panel
 * scrolled to that project.
 */
function ProjectMoon({ project, index }: { project: Project; index: number }) {
  const config = useMemo(() => projectMoonConfig(index, project.accent), [index, project.accent])
  const orbit = useRef<Group>(null)
  const body = useRef<Group>(null)
  const angle = useRef(config.phase)
  const interaction = useRef<InteractionState>({ hover: 0, orbit: 1, dim: 1 })
  const fallback = useMemo(() => proceduralSurface('rocky', ['#6d6a66', '#9a958e', '#4a4744'], 9), [])

  useFrame((_, dt) => {
    const { hoveredProject, activeProject, section } = useAppStore.getState()
    const s = interaction.current
    const lit = hoveredProject === project.id || (section === 'projects' && activeProject === project.id)
    easing.damp(s, 'hover', lit ? 1 : 0, 0.15, dt)
    easing.damp(s, 'orbit', hoveredProject === project.id ? 0 : 1, 0.3, dt)

    angle.current += dt * config.speed * simulation.orbitSpeed * s.orbit
    orbit.current?.position.set(
      Math.cos(angle.current) * config.distance,
      0,
      -Math.sin(angle.current) * config.distance,
    )
    if (orbit.current) orbit.current.rotation.y = -angle.current // tidally locked
    body.current?.scale.setScalar(1 + 0.3 * s.hover)
  })

  const handlers = useMemo(
    () => ({
      onPointerOver: (e: ThreeEvent<PointerEvent>) => {
        if (!canInteract()) return
        e.stopPropagation()
        useAppStore.getState().setHoveredProject(project.id)
        document.body.style.cursor = 'pointer'
      },
      onPointerOut: () => {
        if (useAppStore.getState().hoveredProject === project.id) useAppStore.getState().setHoveredProject(null)
        document.body.style.cursor = ''
      },
      onClick: (e: ThreeEvent<MouseEvent>) => {
        if (!canInteract()) return
        e.stopPropagation()
        if (e.delta > CLICK_SLOP) return
        useAppStore.getState().focusProject(project.id)
      },
    }),
    [project.id],
  )

  return (
    <group rotation-z={config.inclination ?? 0}>
      <group
        ref={(g) => {
          orbit.current = g
          registerMoon(project.id, g, config.radius)
        }}
        name={`Moon: ${project.title}`}
      >
        <group ref={body}>
          <Surface radius={config.radius} textureKey="moon" fallback={fallback} tint={config.tint} />
          <HoverGlow radius={config.radius} interaction={interaction} />
        </group>
        <mesh visible={false} {...handlers}>
          <sphereGeometry args={[Math.max(1.3, config.radius * 2.2), 16, 8]} />
        </mesh>
      </group>
    </group>
  )
}

export default function ProjectMoons() {
  return PROJECTS.map((project, i) => <ProjectMoon key={project.id} project={project} index={i} />)
}
