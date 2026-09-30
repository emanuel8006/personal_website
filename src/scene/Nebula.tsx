import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import { AdditiveBlending, BackSide, Color, type ShaderMaterial } from 'three'
import { reveal } from './registry'

/**
 * Procedural nebula layered over the Milky Way backdrop. Noise is sampled in
 * 3D view-direction space, so there is no seam or pole pinching on the sphere.
 * Static (no time uniform) to keep the per-pixel cost to a single pass.
 */
const vertexShader = /* glsl */ `
  varying vec3 vDir;
  void main() {
    vDir = normalize(position);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const fragmentShader = /* glsl */ `
  uniform vec3 uColorA;
  uniform vec3 uColorB;
  uniform vec3 uColorC;
  uniform float uIntensity;
  varying vec3 vDir;

  // 3D value noise (cheap, smooth enough once layered)
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
      mix(mix(hash(i + vec3(0,0,0)), hash(i + vec3(1,0,0)), f.x),
          mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x), f.y),
      mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x),
          mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x), f.y), f.z);
  }
  float fbm(vec3 p) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 5; i++) {
      v += a * noise(p);
      p = p * 2.03 + vec3(1.7, 9.2, 3.1);
      a *= 0.5;
    }
    return v;
  }

  void main() {
    vec3 d = normalize(vDir);

    // Domain-warp for wispy, filament-like structure
    vec3 q = vec3(fbm(d * 2.2), fbm(d * 2.2 + 5.2), fbm(d * 2.2 + 9.7));
    float n = fbm(d * 3.0 + q * 1.6);

    // Concentrate clouds in a broad band so most of the sky stays dark
    float band = smoothstep(0.75, 0.0, abs(dot(d, normalize(vec3(0.35, 1.0, -0.2)))));
    float density = smoothstep(0.38, 0.8, n) * band;

    vec3 col = mix(uColorA, uColorB, smoothstep(0.3, 0.8, q.x));
    col = mix(col, uColorC, smoothstep(0.6, 0.95, q.y) * 0.5);

    // faint navy floor keeps the empty sky from reading as pure black
    vec3 floorTint = vec3(0.003, 0.004, 0.012);
    gl_FragColor = vec4(col * density * uIntensity + floorTint, 1.0);
    #include <colorspace_fragment>
  }
`

export default function Nebula({ radius = 900, intensity = 0.42 }: { radius?: number; intensity?: number }) {
  const uniforms = useMemo(
    () => ({
      uColorA: { value: new Color('#4a2385') }, // deep violet
      uColorB: { value: new Color('#0f4c6b') }, // teal / cyan
      uColorC: { value: new Color('#6e3a1f') }, // faint amber dust
      uIntensity: { value: intensity },
    }),
    [intensity],
  )
  const material = useRef<ShaderMaterial>(null)
  useFrame(() => {
    if (material.current) material.current.uniforms.uIntensity.value = intensity * reveal.value
  })

  return (
    <mesh renderOrder={-1}>
      <sphereGeometry args={[radius, 64, 32]} />
      <shaderMaterial
        ref={material}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        side={BackSide}
        blending={AdditiveBlending}
        depthWrite={false}
        transparent
      />
    </mesh>
  )
}
