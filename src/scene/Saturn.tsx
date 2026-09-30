import { useFrame } from '@react-three/fiber'
import { Suspense, useEffect, useMemo, useRef } from 'react'
import { easing } from 'maath'
import {
  DoubleSide,
  MeshStandardMaterial,
  RingGeometry,
  Vector3,
  type Group,
  type ShaderMaterial,
  type Texture,
} from 'three'
import { SKILLS } from '../data/content'
import { useAppStore } from '../store'
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
  uniform float uDim;
  uniform float uBandCount;  // one band per skill category, inner → outer
  uniform float uBand;       // highlighted band index
  uniform float uBandAmount; // 0..1 highlight strength
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

    // Skill-category highlight: brighten + tint the hovered band, recede the rest.
    // A faint minimum alpha lets the band read even across the ring's gaps.
    float bandIdx = floor(clamp(vUv.x, 0.0, 0.9999) * uBandCount);
    float inBand = step(abs(bandIdx - uBand), 0.1);
    vec3 glow = vec3(0.37, 0.9, 1.0);
    ringColor = mix(ringColor * (1.0 - 0.5 * uBandAmount), mix(ringColor, glow * dot(ringColor, vec3(0.33)) * 1.9, 0.55 * uBandAmount) + glow * 0.35 * uBandAmount, inBand);
    float alpha = max(tex.a * 0.95, inBand * uBandAmount * 0.3);

    gl_FragColor = vec4(ringColor * brightness * mix(0.08, 1.0, shadow) * uDim, alpha);
    #include <colorspace_fragment>
  }
`

function RingMesh({ map }: { map: Texture }) {
  const geometry = useRingGeometry()
  const material = useRef<ShaderMaterial>(null)
  const band = useRef({ index: 0, amount: 0 })
  const uniforms = useMemo(
    () => ({
      uMap: { value: map },
      uPlanetCenter: { value: ringFrame.center },
      uPlanetRadius: ringFrame.radius,
      uDim: { value: 1 },
      uBandCount: { value: SKILLS.length },
      uBand: { value: 0 },
      uBandAmount: { value: 0 },
    }),
    [map],
  )
  // Follow the skill category hovered in the panel (keep the last index while fading out)
  useFrame((_, dt) => {
    const hovered = useAppStore.getState().hoveredSkill
    const b = band.current
    if (hovered !== null) b.index = hovered
    easing.damp(b, 'amount', hovered !== null ? 1 : 0, 0.18, dt)
    const u = material.current?.uniforms
    if (u) {
      u.uBand.value = b.index
      u.uBandAmount.value = b.amount
    }
  })

  return (
    <mesh geometry={geometry} raycast={() => null}>
      <shaderMaterial
        vertexShader={ringVertex}
        ref={material}
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
        .replace(
          '#include <project_vertex>',
          '#include <project_vertex>\nvRingP = (modelMatrix * vec4(transformed, 1.0)).xyz;',
        )
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
  const fallbackSurface = (
    <SurfaceMesh radius={config.radius} map={proceduralSurface(config.fallback.style, config.fallback.colors)} />
  )

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
