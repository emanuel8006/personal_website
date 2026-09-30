import { useFrame } from '@react-three/fiber'
import { useMemo, useRef, type RefObject } from 'react'
import { AdditiveBlending, Color, type ShaderMaterial } from 'three'
import type { InteractionState } from './interaction'

const vertexShader = /* glsl */ `
  varying vec3 vNormalV;
  varying vec3 vViewPos;
  void main() {
    vNormalV = normalize(normalMatrix * normal);
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vViewPos = mv.xyz;
    gl_Position = projectionMatrix * mv;
  }
`

const fragmentShader = /* glsl */ `
  uniform vec3 uColor;
  uniform float uAmount;
  varying vec3 vNormalV;
  varying vec3 vViewPos;
  void main() {
    float fres = pow(1.0 - clamp(dot(normalize(vNormalV), normalize(-vViewPos)), 0.0, 1.0), 2.2);
    gl_FragColor = vec4(uColor * fres * uAmount * 1.6, 1.0);
    #include <colorspace_fragment>
  }
`

/** Soft cyan rim that fades in while the body is hovered or keyboard-focused. */
export default function HoverGlow({ radius, interaction }: { radius: number; interaction: RefObject<InteractionState> }) {
  const material = useRef<ShaderMaterial>(null)
  const uniforms = useMemo(() => ({ uColor: { value: new Color('#8be9ff') }, uAmount: { value: 0 } }), [])

  useFrame(() => {
    const m = material.current
    if (!m) return
    m.uniforms.uAmount.value = interaction.current.hover
    m.visible = interaction.current.hover > 0.002
  })

  return (
    <mesh scale={radius * 1.025} raycast={() => null}>
      <sphereGeometry args={[1, 48, 24]} />
      <shaderMaterial
        ref={material}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        blending={AdditiveBlending}
        transparent
        depthWrite={false}
      />
    </mesh>
  )
}
