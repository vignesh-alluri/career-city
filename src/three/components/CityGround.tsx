import { useMemo } from 'react'
import { MeshReflectorMaterial } from '@react-three/drei'
import { GROUND_RADIUS } from '../config/layout'
import { COLORS } from '../config/palette'
import { makeRippleTexture } from '../utils/rippleTexture'

/**
 * How the wet street looks. Tune these numbers to taste:
 *  blur          [sideways, vertical]. A much bigger vertical number smears each light into a tall streak, like the
 *                neon reflections in the puddle photo.
 *  mixStrength   how bright the reflections are.   mixContrast: how punchy (higher = darker darks, brighter lights).
 *  mirror        0 = reflections fade into the road colour, 1 = a perfect mirror.
 *  distortion    how much the ripple picture wobbles the reflection.
 */
export const REFLECTION = {
  blur: [140, 460] as [number, number], mixBlur: 1.1, mixStrength: 90, mixContrast: 1.25, mirror: 0.75,
  roughness: 0.55, distortion: 0.5, depthScale: 1, minDepthThreshold: 0.3, maxDepthThreshold: 1.4,
  resolution: 512, // was 768: 2.25 times fewer pixels to draw and blur, every frame
}

/**
 * The ground. On good hardware (`reflections` on) a thin mirror plane sits on top of it: it draws the city upside-down
 * underneath, blurred and faded, so neon signs and lit windows reflect in the wet streets. That means the scene is drawn
 * one extra time per frame, so phones keep the cheaper glossy surface without real reflections.
 */
export function CityGround({ reflections }: { reflections: boolean }) {
  const ripples = useMemo(() => (reflections ? makeRippleTexture() : null), [reflections])
  return (
    <group>
      <mesh position-y={-0.1}>
        <cylinderGeometry args={[GROUND_RADIUS, GROUND_RADIUS, 0.2, 96]} />
        <meshStandardMaterial color={COLORS.ground} roughness={0.28} metalness={0.55} />
      </mesh>
      {reflections && (
        <mesh rotation-x={-Math.PI / 2} position-y={0.004} raycast={() => null}>
          <circleGeometry args={[GROUND_RADIUS - 0.3, 96]} />
          <MeshReflectorMaterial {...REFLECTION} distortionMap={ripples ?? undefined} color="#070D24" metalness={0.6} />
        </mesh>
      )}
      {/* no grid lines on the ground: what you see under the buildings is only their reflections in the wet street */}
      <mesh rotation-x={-Math.PI / 2} position-y={0.01}>
        <ringGeometry args={[GROUND_RADIUS - 0.25, GROUND_RADIUS, 128]} />
        <meshBasicMaterial color={COLORS.pink} toneMapped={false} transparent opacity={0.55} />
      </mesh>
    </group>
  )
}
