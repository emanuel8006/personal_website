import { useFrame } from '@react-three/fiber'
import { Suspense, useEffect, useMemo, useRef } from 'react'
import { DoubleSide, MeshStandardMaterial, RingGeometry, Vector3, type Group, type Texture } from 'three'
import { PLANETS, SATURN_RING } from './bodies'
import Planet, { SurfaceMesh } from './Planet'
import { proceduralRing, proceduralSurface } from './procedural'
import TextureBoundary from './TextureBoundary'
import { useBodyTextures } from './useBodyTextures'

const config = PLANETS.skills
const INNER = config.radius * SATURN_RING.inner
const OUTER = config.radius * SATURN_RING.outer

/**
 * World-space ring frame, shared by the ring shader (planet shadow on the
 * rings) and the body shader (ring shadow on the planet). Updated each frame
 * by RingFrameTracker. Module-level because there is exactly one Saturn.
 */
const ringFrame = { center: new Vector3(), normal: new Vector3(0, 1, 0), radius: { value: config.radius } }

/** RingGeometry with UVs remapped so u runs radially inner → outer (matches the strip texture). */
function useRingGeometry() {
  const geometry = useMemo(() => {
    const g = new RingGeometry(INNER, OUTER, 180, 1)
    const pos = g.attributes.position
    const uv = g.attributes.uv
    const v = new Vector3()
    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i)
      uv.setXY(i, (v.length() - INNER) / (OUTER - INNER), 0.5)
    }
    g.rotateX(-Math.PI / 2) // into the equatorial (XZ) plane
    return g
  }, [])
  useEffect(() => () => geometry.dispose(), [geometry])
  return geometry
}

const ringVertex = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vPosW;
  varying vec3 vNormalW;
  void main() {
    vUv = uv;
    vec4 world = modelMatrix * vec4(position, 1.0);
    vPosW = world.xyz;
    vNormalW = normalize(mat3(modelMatrix) * normal);
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`

const ringFragment = /* glsl */ `
  uniform sampler2D uMap;
  uniform vec3 uPlanetCenter;
  uniform float uPlanetRadius;
  varying vec2 vUv;
  varying vec3 vPosW;
  varying vec3 vNormalW;
  void main() {
    vec4 tex = texture2D(uMap, vec2(vUv.x, 0.5));
    vec3 toSun = normalize(-vPosW);

    // Planet shadow: does the ray from this fragment toward the Sun pass through Saturn?
    vec3 oc = vPosW - uPlanetCenter;
    float along = dot(oc, toSun);
    float miss = length(oc - along * toSun);
    float shadow = along < 0.0 ? smoothstep(uPlanetRadius * 0.92, uPlanetRadius * 1.04, miss) : 1.0;

    // Sunlit face brighter than the face we see through the ring (forward-scattered light)
    float lit = abs(dot(normalize(vNormalW), toSun));
    vec3 viewDir = normalize(cameraPosition - vPosW);
    bool sameSide = dot(vNormalW, toSun) * dot(vNormalW, viewDir) > 0.0;
    float brightness = sameSide ? mix(0.85, 1.35, lit) : 0.55;

    // the Solar System Scope strip is dark grey (avg sRGB ~100): lift and warm it
    // toward Saturn's creamy ring color
    vec3 ringColor = tex.rgb * vec3(1.15, 1.03, 0.86) * 2.4;
    gl_FragColor = vec4(ringColor * brightness * mix(0.08, 1.0, shadow), tex.a * 0.95);
    #include <colorspace_fragment>
  }
`

function RingMesh({ map }: { map: Texture }) {
  const geometry = useRingGeometry()
  const uniforms = useMemo(
    () => ({ uMap: { value: map }, uPlanetCenter: { value: ringFrame.center }, uPlanetRadius: ringFrame.radius }),
    [map],
  )
  return (
    <mesh geometry={geometry} raycast={() => null}>
      <shaderMaterial
        vertexShader={ringVertex}
        fragmentShader={ringFragment}
        uniforms={uniforms}
        side={DoubleSide}
        transparent
        depthWrite={false}
      />
    </mesh>
  )
}

function TexturedRings() {
  const { map } = useBodyTextures({ map: 'saturnRing' })
  return <RingMesh map={map ?? proceduralRing()} />
}

/**
 * Saturn body with the rings' shadow cast onto it: each fragment marches
 * toward the Sun, intersects the ring plane, and samples the ring alpha there.
 */
function SaturnSurface({ map, ringMap }: { map: Texture; ringMap: Texture }) {
  const material = useMemo(() => {
    const m = new MeshStandardMaterial({ map, roughness: 0.9, metalness: 0 })
    m.onBeforeCompile = (shader) => {
      shader.uniforms.uRingMap = { value: ringMap }
      shader.uniforms.uRingCenter = { value: ringFrame.center }
      shader.uniforms.uRingNormal = { value: ringFrame.normal }
      shader.uniforms.uRingInner = { value: INNER }
      shader.uniforms.uRingOuter = { value: OUTER }
      shader.vertexShader = shader.vertexShader
        .replace('#include <common>', '#include <common>\nvarying vec3 vRingP;')
        .replace('#include <project_vertex>', '#include <project_vertex>\nvRingP = (modelMatrix * vec4(transformed, 1.0)).xyz;')
      shader.fragmentShader = shader.fragmentShader
        .replace(
          '#include <common>',
          `#include <common>
          varying vec3 vRingP;
          uniform sampler2D uRingMap;
          uniform vec3 uRingCenter;
          uniform vec3 uRingNormal;
          uniform float uRingInner;
          uniform float uRingOuter;`,
        )
        .replace(
          '#include <map_fragment>',
          /* glsl */ `#include <map_fragment>
          {
            vec3 toSun = normalize(-vRingP);
            float denom = dot(toSun, uRingNormal);
            if (abs(denom) > 1e-4) {
              float t = dot(uRingCenter - vRingP, uRingNormal) / denom;
              if (t > 0.0) {
                float r = length(vRingP + toSun * t - uRingCenter);
                float u = (r - uRingInner) / (uRingOuter - uRingInner);
                if (u > 0.0 && u < 1.0) {
                  float a = texture2D(uRingMap, vec2(u, 0.5)).a;
                  diffuseColor.rgb *= 1.0 - a * 0.75;
                }
              }
            }
          }`,
        )
    }
    m.customProgramCacheKey = () => 'saturn-surface'
    return m
  }, [map, ringMap])

  useEffect(() => () => material.dispose(), [material])

  return (
    <mesh material={material}>
      <sphereGeometry args={[config.radius, 96, 48]} />
    </mesh>
  )
}

function TexturedSaturnSurface() {
  const tex = useBodyTextures({ map: 'saturn', ringMap: 'saturnRing' })
  const map = tex.map ?? proceduralSurface(config.fallback.style, config.fallback.colors)
  return <SaturnSurface map={map} ringMap={tex.ringMap ?? proceduralRing()} />
}

/** Keeps the shared ring frame in sync with Saturn's tilted group. */
const scratch = new Vector3()

function RingFrameTracker() {
  const ref = useRef<Group>(null)
  useFrame(() => {
    const g = ref.current
    if (!g) return
    g.getWorldPosition(ringFrame.center)
    ringFrame.normal.set(0, 1, 0).transformDirection(g.matrixWorld)
    ringFrame.radius.value = config.radius * g.getWorldScale(scratch).x
  })
  return <group ref={ref} />
}

export default function Saturn() {
  const fallbackSurface = <SurfaceMesh radius={config.radius} map={proceduralSurface(config.fallback.style, config.fallback.colors)} />

  return (
    <Planet
      config={config}
      surface={
        <TextureBoundary fallback={fallbackSurface}>
          <Suspense fallback={null}>
            <TexturedSaturnSurface />
          </Suspense>
        </TextureBoundary>
      }
      tilted={
        <>
          <RingFrameTracker />
          <TextureBoundary fallback={<RingMesh map={proceduralRing()} />}>
            <Suspense fallback={null}>
              <TexturedRings />
            </Suspense>
          </TextureBoundary>
        </>
      }
    />
  )
}
