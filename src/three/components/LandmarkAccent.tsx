import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { CrownKind, Vec3 } from '../config/layout'

function Neon({ color, opacity = 1 }: { color: string; opacity?: number }) {
  return <meshBasicMaterial color={color} toneMapped={false} transparent={opacity < 1} opacity={opacity} />
}

interface Props { kind: CrownKind; color: string; position: Vec3; animate: boolean }

/** The identifying decoration on top of each district's landmark: a lens, antenna, clock, beacon or orbit rings. */
export function LandmarkAccent({ kind, color, position, animate }: Props) {
  const spin = useRef<THREE.Group>(null)

  // useFrame runs every rendered frame. We change the rotation directly on the object (no React state),
  // so nothing re-renders. `delta` is seconds since the last frame, which keeps speed the same on any frame rate.
  useFrame((_, delta) => {
    if (animate && spin.current) spin.current.rotation.y += delta * 0.6
  })

  return (
    <group position={position}>
      {kind === 'lens' && (
        <group position={[0, 1.0, 0]} rotation={[0.35, 0, 0]}>
          <mesh><torusGeometry args={[0.55, 0.07, 10, 32]} /><Neon color={color} /></mesh>
          <mesh position={[0.64, -0.64, 0]} rotation={[0, 0, Math.PI / 4]}>
            <cylinderGeometry args={[0.06, 0.06, 0.7, 8]} /><Neon color={color} />
          </mesh>
        </group>
      )}
      {kind === 'antenna' && (
        <>
          <mesh position={[0, 0.8, 0]}><cylinderGeometry args={[0.035, 0.06, 1.6, 6]} /><Neon color={color} opacity={0.8} /></mesh>
          <mesh position={[0, 1.65, 0]}><sphereGeometry args={[0.12, 12, 12]} /><Neon color={color} /></mesh>
        </>
      )}
      {kind === 'clock' && (
        <group position={[0, 1.1, 0]}>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.75, 0.75, 0.1, 32]} /><meshBasicMaterial color="#0B1020" />
          </mesh>
          <mesh><torusGeometry args={[0.75, 0.05, 8, 40]} /><Neon color={color} /></mesh>
          <mesh position={[0, 0.2, 0.07]}><boxGeometry args={[0.05, 0.4, 0.02]} /><Neon color={color} /></mesh>
          <mesh position={[0.17, 0, 0.07]}><boxGeometry args={[0.35, 0.05, 0.02]} /><Neon color={color} /></mesh>
        </group>
      )}
      {kind === 'beacon' && (
        <>
          <group ref={spin} position={[0, 1.2, 0]}>
            <mesh><octahedronGeometry args={[0.5]} /><Neon color={color} /></mesh>
          </group>
          <mesh position={[0, 4, 0]} raycast={() => null}>
            <cylinderGeometry args={[0.3, 0.3, 8, 16, 1, true]} />
            <meshBasicMaterial color={color} transparent opacity={0.1} toneMapped={false} depthWrite={false}
              side={THREE.DoubleSide} blending={THREE.AdditiveBlending} />
          </mesh>
        </>
      )}
      {kind === 'orbit' && (
        <group ref={spin} position={[0, 1.0, 0]}>
          <mesh rotation={[Math.PI / 2.4, 0, 0]}><torusGeometry args={[0.9, 0.03, 8, 48]} /><Neon color={color} /></mesh>
          <mesh rotation={[Math.PI / 2.4, 0, Math.PI / 2.5]}><torusGeometry args={[0.9, 0.03, 8, 48]} /><Neon color={color} opacity={0.6} /></mesh>
          <mesh><sphereGeometry args={[0.18, 12, 12]} /><Neon color={color} /></mesh>
        </group>
      )}
    </group>
  )
}
