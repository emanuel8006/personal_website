import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import { AdditiveBlending, Color, type Group, type ShaderMaterial, type Sprite } from 'three'
import { SUN_RADIUS } from './bodies'
import { coronaRays, radialGlow } from './procedural'
import { bodyPointerHandlers, useBodyInteraction } from './interaction'
import { registerBody, simulation } from './registry'
import { useBodyTextures } from './useBodyTextures'

/**
 * Emissive surface: the photosphere texture (if present) is gently warped by
 * animated noise, modulated by moving granulation and limb-darkened. Output
 * is HDR (> 1) so Bloom picks it up.
 */
const vertexShader = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vObj;
  varying vec3 vNormalV;
  varying vec3 vViewPos;
  void main() {
    vUv = uv;
    vObj = normalize(position);
    vNormalV = normalize(normalMatrix * normal);
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vViewPos = mv.xyz;
    gl_Position = projectionMatrix * mv;
  }
`

const fragmentShader = /* glsl */ `
  uniform sampler2D uMap;
  uniform bool uHasMap;
  uniform float uTime;
  uniform vec3 uHot;
  uniform vec3 uCool;
  uniform float uIntensity;
  uniform float uDim;
  varying vec2 vUv;
  varying vec3 vObj;
  varying vec3 vNormalV;
  varying vec3 vViewPos;

  float hash(vec3 p) {
    p = fract(p * 0.3183099 + 0.1);
    p *= 17.0;
    return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
  }
  float noise(vec3 x) {
    vec3 i = floor(x);
    vec3 f = fract(x);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(mix(hash(i), hash(i + vec3(1,0,0)), f.x), mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x), f.y),
      mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x), mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x), f.y),
      f.z);
  }
  float fbm(vec3 p) {
    float v = 0.0, a = 0.5;
    for (int i = 0; i < 4; i++) { v += a * noise(p); p *= 2.07; a *= 0.5; }
    return v;
  }

  void main() {
    float t = uTime;
    vec3 p = vObj;

    // Slow boiling: warp the lookup and layer moving granulation
    vec2 warp = vec2(fbm(p * 3.0 + t * 0.04), fbm(p * 3.0 + 11.0 - t * 0.035)) - 0.5;
    float gran = fbm(p * 14.0 + vec3(t * 0.12, -t * 0.08, t * 0.1));
    float cells = fbm(p * 5.0 - t * 0.05);

    vec3 base = uHasMap ? texture2D(uMap, vUv + warp * 0.012).rgb : mix(uCool, uHot, cells);
    vec3 col = base * (0.7 + 0.65 * gran) + uHot * smoothstep(0.62, 0.8, cells) * 0.35;

    // Limb darkening: edges cooler and dimmer, as on the real Sun
    float mu = clamp(dot(normalize(vNormalV), normalize(-vViewPos)), 0.0, 1.0);
    col *= mix(0.55, 1.0, pow(mu, 0.45));
    col = mix(uCool * 0.8, col, 0.35 + 0.65 * mu);

    gl_FragColor = vec4(col * uIntensity * uDim, 1.0);
    #include <colorspace_fragment>
  }
`

/** [scale multiple of radius, color, opacity, spin speed] */
const CORONA_LAYERS: [number, string, number, number][] = [
  [2.6, '#ffd08a', 0.95, 0],
  [4.2, '#ff9a3c', 0.42, 0],
  [7.5, '#ff7a18', 0.16, 0],
]

const BASE_INTENSITY = 2.6

export default function Sun() {
  const { map } = useBodyTextures({ map: 'sun' })
  const root = useRef<Group>(null)
  const body = useRef<Group>(null)
  const interaction = useBodyInteraction('about', root, body, 0.04)
  const handlers = useMemo(() => bodyPointerHandlers('about'), [])
  const material = useRef<ShaderMaterial>(null)
  const rays = useRef<Sprite>(null)
  const rays2 = useRef<Sprite>(null)

  const uniforms = useMemo(
    () => ({
      uMap: { value: map ?? null },
      uHasMap: { value: Boolean(map) },
      uTime: { value: 0 },
      uHot: { value: new Color('#ffcc66') },
      uCool: { value: new Color('#ff5a0a') },
      uIntensity: { value: BASE_INTENSITY },
      uDim: { value: 1 },
    }),
    [map],
  )

  const glow = radialGlow()
  const rayTex = coronaRays()

  useFrame((_, dt) => {
    if (material.current) {
      material.current.uniforms.uTime.value += dt * simulation.ambient
      material.current.uniforms.uIntensity.value = BASE_INTENSITY + 0.6 * interaction.current.hover
    }
    if (rays.current) rays.current.material.rotation += dt * 0.01 * simulation.ambient
    if (rays2.current) rays2.current.material.rotation -= dt * 0.006 * simulation.ambient
  })

  return (
    <group
      ref={(g) => {
        root.current = g
        registerBody('about', g, SUN_RADIUS)
      }}
      name="Sun"
    >
      <group ref={body}>
        <mesh>
          <sphereGeometry args={[SUN_RADIUS, 96, 48]} />
          <shaderMaterial
            ref={material}
            vertexShader={vertexShader}
            fragmentShader={fragmentShader}
            uniforms={uniforms}
          />
        </mesh>

        {CORONA_LAYERS.map(([scale, color, opacity], i) => (
          <sprite key={i} scale={SUN_RADIUS * scale} raycast={() => null}>
            <spriteMaterial
              map={glow}
              color={new Color(color).multiplyScalar(1.6)}
              opacity={opacity}
              blending={AdditiveBlending}
              depthWrite={false}
              transparent
            />
          </sprite>
        ))}
        <sprite ref={rays} scale={SUN_RADIUS * 6} raycast={() => null}>
          <spriteMaterial
            map={rayTex}
            color="#ffb060"
            opacity={0.5}
            blending={AdditiveBlending}
            depthWrite={false}
            transparent
          />
        </sprite>
        <sprite ref={rays2} scale={SUN_RADIUS * 4.6} raycast={() => null}>
          <spriteMaterial
            map={rayTex}
            color="#ffd9a0"
            opacity={0.35}
            rotation={1.3}
            blending={AdditiveBlending}
            depthWrite={false}
            transparent
          />
        </sprite>
      </group>

      <mesh visible={false} {...handlers}>
        <sphereGeometry args={[SUN_RADIUS * 1.2, 24, 12]} />
      </mesh>

      {/* Main light. decay=0: artistic scale, so outer planets aren't left in the dark */}
      <pointLight intensity={3.4} decay={0} color="#fff3e0" />
    </group>
  )
}
