import { DISTRICT_LAYOUTS, DISTRICT_RADIUS, RING_RADIUS, type Vec3 } from '../config/layout'

export interface BoxItem { position: Vec3; scale: Vec3; rotationY?: number }

const SCALE = 1.9
/** Just beyond the outer edge of each district, so the gate frames the district when seen from outside the city. */
export const TORII_RADIUS = RING_RADIUS + DISTRICT_RADIUS + 0.8

/** Positions of every gate part. Kept as a plain function so it can be checked without a browser. */
export function toriiParts() {
  const pillars: BoxItem[] = [], beams: BoxItem[] = [], tops: BoxItem[] = []
  const gates: { id: string; center: [number, number, number]; height: number }[] = []
  for (const l of DISTRICT_LAYOUTS) {
    const cx = Math.sin(l.angle) * TORII_RADIUS, cz = Math.cos(l.angle) * TORII_RADIUS
    const tx = Math.cos(l.angle), tz = -Math.sin(l.angle) // across the road
    for (const side of [1, -1]) {
      pillars.push({ position: [cx + tx * 0.72 * SCALE * side, 0.75 * SCALE, cz + tz * 0.72 * SCALE * side], scale: [0.11 * SCALE, 1.5 * SCALE, 0.11 * SCALE], rotationY: l.angle })
    }
    beams.push({ position: [cx, 1.2 * SCALE, cz], scale: [1.5 * SCALE, 0.07 * SCALE, 0.09 * SCALE], rotationY: l.angle })
    tops.push({ position: [cx, 1.6 * SCALE, cz], scale: [1.95 * SCALE, 0.09 * SCALE, 0.17 * SCALE], rotationY: l.angle })
    gates.push({ id: l.id, center: [cx, 0.8 * SCALE, cz], height: 1.65 * SCALE })
  }
  return { pillars, beams, tops, gates }
}
