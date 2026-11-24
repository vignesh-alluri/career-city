import type { CityQuality, DistrictId } from '@/types'
import { DISTRICT_LAYOUTS, type Vec3 } from '../config/layout'
import { generateDistrictGeometry } from './buildingLayout'

const PLATFORM_HEIGHT = 0.2

/**
 * Where each district's name label hangs in the 3D world: above the district's WHOLE skyline (landmark decoration and
 * rooftop signs, which reach about 1.7 above the roofs), so it is never buried in them. It uses the full district, not
 * the grown one, so the label does not jump as buildings are added.
 */
export function labelAnchors(quality: CityQuality): { id: DistrictId; world: Vec3 }[] {
  return DISTRICT_LAYOUTS.map((l) => {
    const g = generateDistrictGeometry(l.id, l.profile, quality)
    const skyline = Math.max(...g.boxes.map((b) => (b.y0 ?? 0) + b.h))
    const y = Math.max(g.crown[1] + 1.8, skyline + 2.4)
    return { id: l.id, world: [l.position[0] + g.crown[0], PLATFORM_HEIGHT + y, l.position[2] + g.crown[2]] }
  })
}
