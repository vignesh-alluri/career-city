import { DISTRICT_IDS, type DistrictId } from '@/types'

export type Vec3 = [number, number, number]
export type Profile = 'market' | 'towers' | 'campus' | 'monument' | 'bars'
export type CrownKind = 'lens' | 'antenna' | 'clock' | 'beacon' | 'orbit'

export const RING_RADIUS = 10.5     // distance from plaza to each district centre
export const PLAZA_RADIUS = 3.2
export const DISTRICT_RADIUS = 3.7
export const GROUND_RADIUS = 24
export const CAMERA_START: Vec3 = [37, 29, 37]
export const CAMERA_TARGET: Vec3 = [0, 1.5, 0]

export interface DistrictLayout {
  id: DistrictId
  angle: number      // radians, measured from +z towards +x
  position: Vec3
  profile: Profile
  crown: CrownKind
}

const STYLE: Record<DistrictId, { profile: Profile; crown: CrownKind }> = {
  discovery: { profile: 'market', crown: 'lens' },        // low market stalls + a search lens
  application: { profile: 'towers', crown: 'antenna' },   // dense office towers
  interview: { profile: 'campus', crown: 'clock' },       // mid-rise campus + a clock
  achievement: { profile: 'monument', crown: 'beacon' },  // stepped monument + a beacon
  analytics: { profile: 'bars', crown: 'orbit' },         // rising bars like a chart
}

/** The five districts are spaced evenly (72 degrees apart) on a ring around the central plaza. */
export const DISTRICT_LAYOUTS: readonly DistrictLayout[] = DISTRICT_IDS.map((id, i) => {
  const angle = (i * Math.PI * 2) / DISTRICT_IDS.length
  return {
    id, angle,
    position: [Math.sin(angle) * RING_RADIUS, 0, Math.cos(angle) * RING_RADIUS],
    ...STYLE[id],
  }
})
