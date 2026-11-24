import { useEffect, useMemo } from 'react'
import type { ThreeEvent } from '@react-three/fiber'
import { DISTRICT_IDS, type CityQuality } from '@/types'
import type { DistrictInfo } from '@/config/districts'
import { useCityStore } from '@/store/cityStore'
import { DISTRICT_RADIUS, type DistrictLayout } from '../config/layout'
import { COLORS } from '../config/palette'
import { generateDistrictGeometry } from '../utils/buildingLayout'
import { applyGrowth } from '../utils/cityGrowth'
import { generateWindows } from '../utils/windows'
import { hashString } from '../utils/random'
import { Building } from './Building'
import { NeonSigns } from './NeonSigns'
import { BuildingDetails } from './BuildingDetails'
import { LandmarkAccent } from './LandmarkAccent'

interface DistrictProps {
  info: DistrictInfo; layout: DistrictLayout; quality: CityQuality; animate: boolean
  /** Number of real applications in this district. Leave undefined for the demo city, where every building is built. */
  count?: number
}

const PLATFORM_HEIGHT = 0.2

export function District({ info, layout, quality, animate, count }: DistrictProps) {
  // useMemo caches a computed value between renders, so the city is generated once, not every re-render.
  const geometry = useMemo(() => generateDistrictGeometry(info.id, layout.profile, quality), [info.id, layout.profile, quality])
  const seed = hashString(info.id) + 1 // shared by the windows and the body tints so they always agree
  // Phase 7: one application = one built building; the remaining plots stay dark and empty.
  const boxes = useMemo(() => applyGrowth(geometry.boxes, geometry.landmarkCount, layout.profile, count).boxes, [geometry, layout.profile, count])
  const windows = useMemo(
    () => generateWindows(boxes, quality === 'high' ? 0.5 : 0.38, seed),
    [boxes, quality, seed],
  )
  const [cx, cy, cz] = geometry.crown
  // This selector returns a boolean, so the district re-renders only when ITS highlight state flips,
  // not whenever any other district is hovered.
  const active = useCityStore(
    (s) => s.hovered === info.id || s.selected === info.id || (s.mode === 'scroll' && DISTRICT_IDS[s.activeSection - 1] === info.id),
  )
  const setHovered = useCityStore((s) => s.setHovered)
  const clearHovered = useCityStore((s) => s.clearHovered)
  const select = useCityStore((s) => s.select)

  useEffect(() => () => { document.body.style.cursor = '' }, [])

  const onOver = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation() // don't also "hover" a district hidden behind this one
    setHovered(info.id)
    document.body.style.cursor = 'pointer'
  }
  const onOut = () => {
    clearHovered(info.id)
    document.body.style.cursor = ''
  }
  const onClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation()
    select(info.id)
  }

  return (
    // Events from any child mesh bubble up to this group, so one set of handlers covers the whole district.
    <group position={layout.position} onPointerOver={onOver} onPointerOut={onOut} onClick={onClick}>
      {/* octagonal platform: the 8 radial segments give it flat, isometric-looking sides */}
      <mesh position-y={PLATFORM_HEIGHT / 2}>
        <cylinderGeometry args={[DISTRICT_RADIUS, DISTRICT_RADIUS + 0.2, PLATFORM_HEIGHT, 8]} />
        <meshStandardMaterial color={COLORS.platform} roughness={0.7} metalness={0.3} emissive={info.color} emissiveIntensity={active ? 0.12 : 0.04} />
      </mesh>
      {/* neon marker ring along the platform edge, with a soft halo that appears when the district is highlighted */}
      <mesh rotation-x={-Math.PI / 2} position-y={PLATFORM_HEIGHT + 0.015}>
        <ringGeometry args={[DISTRICT_RADIUS - 0.2, DISTRICT_RADIUS, 8, 1]} />
        <meshBasicMaterial color={info.color} toneMapped={false} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position-y={PLATFORM_HEIGHT + 0.01} visible={active} raycast={() => null}>
        <ringGeometry args={[DISTRICT_RADIUS - 0.9, DISTRICT_RADIUS + 0.5, 8, 1]} />
        <meshBasicMaterial color={info.color} toneMapped={false} transparent opacity={0.16} depthWrite={false} />
      </mesh>

      <group position-y={PLATFORM_HEIGHT}>
        <Building boxes={boxes} windows={windows} color={info.color} active={active} seed={seed} />
        <BuildingDetails boxes={boxes} seed={seed} quality={quality} />
        <NeonSigns boxes={boxes} words={info.signs} color={info.color} seed={seed} count={quality === 'high' ? 6 : 3} firstIndex={geometry.landmarkCount} yaw={layout.angle} />
        <LandmarkAccent kind={layout.crown} color={info.color} position={[cx, cy, cz]} animate={animate} />
      </group>
    </group>
  )
}
