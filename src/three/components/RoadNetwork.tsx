import { DISTRICT_BY_ID } from '@/config/districts'
import { DISTRICT_LAYOUTS, DISTRICT_RADIUS, PLAZA_RADIUS, RING_RADIUS } from '../config/layout'
import { COLORS } from '../config/palette'

const SPOKE_START = PLAZA_RADIUS - 0.3
const SPOKE_END = RING_RADIUS - DISTRICT_RADIUS + 0.2
const SPOKE_LENGTH = SPOKE_END - SPOKE_START
const SPOKE_MID = (SPOKE_START + SPOKE_END) / 2
const ROAD = '#0B0D1F'

/** Five spoke roads from the plaza to each district, plus a ring road joining the districts. */
export function RoadNetwork({ reflective }: { reflective: boolean }) {
  const roadOpacity = reflective ? 0.6 : 1 // partly see-through, so the mirror ground below shows reflections in the road
  return (
    <group>
      {DISTRICT_LAYOUTS.map((l) => (
        // Rotating the group by the district's angle lets us draw every spoke along the same local +z axis.
        <group key={l.id} rotation-y={l.angle}>
          <mesh position={[0, 0.05, SPOKE_MID]}>
            <boxGeometry args={[0.9, 0.1, SPOKE_LENGTH]} />
            <meshStandardMaterial color={ROAD} roughness={0.3} metalness={0.5} transparent={reflective} opacity={roadOpacity} />
          </mesh>
          <mesh position={[0, 0.06, SPOKE_MID]}>
            <boxGeometry args={[0.06, 0.12, SPOKE_LENGTH]} />
            <meshBasicMaterial color={DISTRICT_BY_ID[l.id].color} toneMapped={false} transparent opacity={0.55} />
          </mesh>
        </group>
      ))}
      <mesh rotation-x={-Math.PI / 2} position-y={0.07}>
        <ringGeometry args={[RING_RADIUS - 0.5, RING_RADIUS + 0.5, 128]} />
        <meshStandardMaterial color={ROAD} roughness={0.3} metalness={0.5} transparent={reflective} opacity={roadOpacity} />
      </mesh>
      {[-0.52, 0.48].map((offset) => (
        <mesh key={offset} rotation-x={-Math.PI / 2} position-y={0.075}>
          <ringGeometry args={[RING_RADIUS + offset, RING_RADIUS + offset + 0.04, 128]} />
          <meshBasicMaterial color={COLORS.accent} toneMapped={false} transparent opacity={0.35} />
        </mesh>
      ))}
    </group>
  )
}
