import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { PLAZA_RADIUS } from '../config/layout'
import { COLORS } from '../config/palette'
import { TokyoTower, TOWER_TOP } from './TokyoTower'

const BASE = 0.24 // top of the plaza slab

/** The focal point of the city: a plaza with a Tokyo Tower standing on it. */
export function CentralPlaza({ animate }: { animate: boolean }) {
  const tip = useRef<THREE.Mesh>(null)
  useFrame(({ clock }) => {
    // the red aviation light on the tip slowly pulses
    if (animate && tip.current) tip.current.scale.setScalar(1 + 0.35 * Math.sin(clock.elapsedTime * 2.4))
  })

  return (
    <group>
      <mesh position-y={0.12}>
        <cylinderGeometry args={[PLAZA_RADIUS, PLAZA_RADIUS + 0.15, 0.24, 64]} />
        <meshStandardMaterial color="#0E1628" roughness={0.6} metalness={0.35} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position-y={0.255}>
        <ringGeometry args={[PLAZA_RADIUS - 0.3, PLAZA_RADIUS - 0.15, 64]} />
        <meshBasicMaterial color={COLORS.orange} toneMapped={false} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position-y={0.255}>
        <ringGeometry args={[1.95, 2.02, 64]} />
        <meshBasicMaterial color={COLORS.pink} toneMapped={false} />
      </mesh>

      <group position-y={BASE}>
        <TokyoTower />
        <mesh ref={tip} position-y={TOWER_TOP + 0.1}>
          <sphereGeometry args={[0.1, 10, 10]} /><meshBasicMaterial color={COLORS.red} toneMapped={false} />
        </mesh>
      </group>

      <pointLight position={[0, 0.9, 0]} color={COLORS.pink} intensity={14} distance={9} decay={2} />
      <pointLight position={[0, 5.5, 0]} color="#FF7A2F" intensity={26} distance={18} decay={2} />
    </group>
  )
}
