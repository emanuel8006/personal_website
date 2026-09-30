import { useMemo } from 'react'
import { AdditiveBlending, BackSide, Color, FrontSide } from 'three'
import type { AtmosphereConfig } from './bodies'

/**
 * Fresnel atmosphere in two shells:
 *  - rim:  front faces just above the surface, brightening toward the limb
 *  - halo: back faces further out, fading to zero at the outer edge
 * Both are weighted toward the sunlit side (Sun at the world origin), so the
 * night side stays dark.
 */

const vertexShader = /* glsl */ `
  varying vec3 vNormalW;
  varying vec3 vPosW;
  void main() {
    vec4 world = modelMatrix * vec4(position, 1.0);
    vPosW = world.xyz;
    vNormalW = normalize(mat3(modelMatrix) * normal);
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`

const rimFragment = /* glsl */ `
  uniform vec3 uColor;
  uniform float uIntensity;
  varying vec3 vNormalW;
  varying vec3 vPosW;
  void main() {
    vec3 n = normalize(vNormalW);
    vec3 v = normalize(cameraPosition - vPosW);
    float fres = pow(1.0 - clamp(dot(n, v), 0.0, 1.0), 3.0);
    float day = smoothstep(-0.35, 0.5, dot(n, normalize(-vPosW)));
    gl_FragColor = vec4(uColor * fres * uIntensity * (0.08 + day), 1.0);
    #include <colorspace_fragment>
  }
`

const haloFragment = /* glsl */ `
  uniform vec3 uColor;
  uniform float uIntensity;
  uniform float uInner; // -dot(n, v) where the view ray grazes the planet surface
  varying vec3 vNormalW;
  varying vec3 vPosW;
  void main() {
    vec3 n = normalize(vNormalW);
    vec3 v = normalize(cameraPosition - vPosW);
    float t = clamp(-dot(n, v) / uInner, 0.0, 1.0);
    float glow = pow(t, 3.6);
    float day = smoothstep(-0.4, 0.5, dot(n, normalize(-vPosW)));
    gl_FragColor = vec4(uColor * glow * uIntensity * (0.05 + day), 1.0);
    #include <colorspace_fragment>
  }
`

const RIM_SCALE = 1.012
const HALO_SCALE = 1.14

export default function Atmosphere({ radius, config }: { radius: number; config: AtmosphereConfig }) {
  const color = useMemo(() => new Color(config.color), [config.color])
  const rimUniforms = useMemo(() => ({ uColor: { value: color }, uIntensity: { value: config.rim } }), [color, config.rim])
  const haloUniforms = useMemo(
    () => ({
      uColor: { value: color },
      uIntensity: { value: config.halo },
      uInner: { value: Math.sqrt(1 - 1 / (HALO_SCALE * HALO_SCALE)) },
    }),
    [color, config.halo],
  )

  return (
    <>
      <mesh scale={radius * RIM_SCALE} raycast={() => null}>
        <sphereGeometry args={[1, 64, 32]} />
        <shaderMaterial
          vertexShader={vertexShader}
          fragmentShader={rimFragment}
          uniforms={rimUniforms}
          side={FrontSide}
          blending={AdditiveBlending}
          transparent
          depthWrite={false}
        />
      </mesh>
      {config.halo > 0 && (
        <mesh scale={radius * HALO_SCALE} raycast={() => null}>
          <sphereGeometry args={[1, 64, 32]} />
          <shaderMaterial
            vertexShader={vertexShader}
            fragmentShader={haloFragment}
            uniforms={haloUniforms}
            side={BackSide}
            blending={AdditiveBlending}
            transparent
            depthWrite={false}
          />
        </mesh>
      )}
    </>
  )
}
