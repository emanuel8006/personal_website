import { useFrame } from '@react-three/fiber'
import { Suspense, useEffect, useMemo, useRef } from 'react'
import { Color, MeshStandardMaterial, Vector2, type Group } from 'three'
import { EARTH_MOON, PLANETS } from './bodies'
import Planet, { Moon, SurfaceMesh } from './Planet'
import { proceduralClouds, proceduralSurface } from './procedural'
import TextureBoundary from './TextureBoundary'
import { useBodyTextures } from './useBodyTextures'

const config = PLANETS.education

/**
 * Earth surface on MeshStandardMaterial, with two shader tweaks:
 *  - the specular map (white = ocean) drives roughness inversely, so oceans shine
 *  - city lights (emissive) only show on the night side, fading across the terminator
 */
function EarthSurface() {
  const tex = useBodyTextures({
    map: 'earthDay',
    normalMap: 'earthNormal',
    roughnessMap: 'earthSpecular',
    emissiveMap: 'earthNight',
  })

  const material = useMemo(() => {
    const m = new MeshStandardMaterial({
      map: tex.map ?? proceduralSurface(config.fallback.style, config.fallback.colors),
      normalMap: tex.normalMap ?? null,
      normalScale: new Vector2(0.85, 0.85),
      roughnessMap: tex.roughnessMap ?? null,
      roughness: tex.roughnessMap ? 1 : 0.85,
      metalness: 0,
      emissiveMap: tex.emissiveMap ?? null,
      emissive: new Color(tex.emissiveMap ? '#ffd8a8' : '#000000'),
      emissiveIntensity: 1.8,
    })

    m.onBeforeCompile = (shader) => {
      shader.vertexShader = shader.vertexShader
        .replace('#include <common>', '#include <common>\nvarying vec3 vSunN;\nvarying vec3 vSunP;')
        .replace(
          '#include <project_vertex>',
          '#include <project_vertex>\nvSunN = normalize(mat3(modelMatrix) * objectNormal);\nvSunP = (modelMatrix * vec4(transformed, 1.0)).xyz;',
        )
      shader.fragmentShader = shader.fragmentShader
        .replace('#include <common>', '#include <common>\nvarying vec3 vSunN;\nvarying vec3 vSunP;')
        .replace(
          '#include <roughnessmap_fragment>',
          /* glsl */ `
          float roughnessFactor = roughness;
          #ifdef USE_ROUGHNESSMAP
            float specMask = texture2D(roughnessMap, vRoughnessMapUv).g;
            roughnessFactor = mix(0.95, 0.4, specMask);
          #endif`,
        )
        .replace(
          '#include <emissivemap_fragment>',
          /* glsl */ `
          #ifdef USE_EMISSIVEMAP
            vec4 emissiveColor = texture2D(emissiveMap, vEmissiveMapUv);
            float sunFacing = dot(normalize(vSunN), normalize(-vSunP)); // Sun at origin
            totalEmissiveRadiance *= emissiveColor.rgb * smoothstep(0.05, -0.25, sunFacing);
          #endif`,
        )
    }
    m.customProgramCacheKey = () => 'earth-surface'
    return m
  }, [tex.map, tex.normalMap, tex.roughnessMap, tex.emissiveMap])

  useEffect(() => () => material.dispose(), [material])

  return (
    <mesh material={material}>
      <sphereGeometry args={[config.radius, 96, 48]} />
    </mesh>
  )
}

/** Cloud shell, spinning a little faster than the surface. */
function Clouds() {
  const { alphaMap } = useBodyTextures({ alphaMap: 'earthClouds' })
  const ref = useRef<Group>(null)
  const map = alphaMap ?? proceduralClouds()

  useFrame((_, dt) => {
    if (ref.current) ref.current.rotation.y += dt * (config.spinSpeed * 1.35)
  })

  return (
    <group ref={ref}>
      <mesh raycast={() => null}>
        <sphereGeometry args={[config.radius * 1.008, 96, 48]} />
        <meshStandardMaterial color="#ffffff" alphaMap={map} transparent opacity={0.92} roughness={1} metalness={0} depthWrite={false} />
      </mesh>
    </group>
  )
}

export default function Earth() {
  const fallback = <SurfaceMesh radius={config.radius} map={proceduralSurface(config.fallback.style, config.fallback.colors)} />
  return (
    <Planet
      config={config}
      surface={
        <TextureBoundary fallback={fallback}>
          <Suspense fallback={null}>
            <EarthSurface />
          </Suspense>
        </TextureBoundary>
      }
      tilted={
        <TextureBoundary fallback={null}>
          <Suspense fallback={null}>
            <Clouds />
          </Suspense>
        </TextureBoundary>
      }
    >
      <Moon config={EARTH_MOON} />
    </Planet>
  )
}
