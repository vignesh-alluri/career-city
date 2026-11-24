import { DISTRICT_LAYOUTS, RING_RADIUS, type Vec3 } from '@/three/config/layout'
import { DISTRICT_IDS, type DistrictId } from '@/types'

/**
 * Shared, MUTABLE scroll values. This is deliberately a plain object and not React state:
 * ScrollTrigger writes to it many times per second and the 3D loop reads it every frame.
 * Changing it re-renders nothing, so there is no conflict between GSAP and React Three Fiber.
 */
export const scrollState = { progress: 0, exploreFrom: 0 }

export type Stop = 'overview' | DistrictId | 'finale'
export const STOPS: readonly Stop[] = ['overview', ...DISTRICT_IDS, 'finale']

/**
 * A camera pose in cylindrical coordinates: an angle around the city, a distance from its centre, a height,
 * and the point it looks at. Interpolating angle/radius/height (instead of x/y/z) makes the camera travel along
 * an arc AROUND the city rather than cutting straight through the buildings.
 */
export interface CameraPose { angle: number; radius: number; height: number; target: Vec3 }

export const SIDE_LAYOUT_ASPECT = 1.35 // wider than this: text on the left, city on the right
export const TWO_PI = Math.PI * 2
const OVERVIEW_ANGLE = -0.628

/** On narrow screens the camera zooms out so the city still fits. */
export const zoomFor = (aspect: number) => Math.min(1, aspect / 1.05)

/**
 * Moves the look-at point sideways (wide screens) or down (tall screens) so the subject appears
 * beside the text instead of behind it.
 */
function pose(angle: number, radius: number, height: number, focus: Vec3, sideShift: number, stackShift: number, aspect: number): CameraPose {
  if (aspect >= SIDE_LAYOUT_ASPECT) {
    const s = sideShift * Math.min(1, aspect / 1.78)
    // the camera's "right" direction is (cos a, 0, -sin a); we aim LEFT of the subject so it appears on the right
    return { angle, radius, height, target: [focus[0] - Math.cos(angle) * s, focus[1], focus[2] + Math.sin(angle) * s] }
  }
  return { angle, radius, height, target: [focus[0], focus[1] - stackShift / zoomFor(aspect), focus[2]] }
}

export function stopPose(stop: Stop, aspect: number): CameraPose {
  if (stop === 'overview') return pose(OVERVIEW_ANGLE, 48, 27, [0, 1.5, 0], 5, 7, aspect)
  if (stop === 'finale') return pose(OVERVIEW_ANGLE + TWO_PI, 52, 30, [0, 1.5, 0], 4, 8, aspect)
  const l = DISTRICT_LAYOUTS.find((d) => d.id === stop)!
  return pose(l.angle + 0.14, RING_RADIUS + 24, 15, [l.position[0], 3.6, l.position[2]], 6, 3.5, aspect)
}

const clamp01 = (n: number) => Math.min(1, Math.max(0, n))
const smooth = (t: number) => t * t * (3 - 2 * t)
const lerp = (a: number, b: number, t: number) => a + (b - a) * t

/** Where the camera should be for a given scroll progress (0..1). */
export function scrollPose(progress: number, aspect: number): CameraPose {
  const f = clamp01(progress) * (STOPS.length - 1)
  const i = Math.min(Math.floor(f), STOPS.length - 2)
  // The camera rests for the first and last 20% of every section, so each district gets a calm moment.
  const t = smooth(clamp01((f - i - 0.2) / 0.6))
  const a = stopPose(STOPS[i], aspect)
  const b = stopPose(STOPS[i + 1], aspect)
  return {
    angle: lerp(a.angle, b.angle, t),
    radius: lerp(a.radius, b.radius, t),
    height: lerp(a.height, b.height, t),
    target: [lerp(a.target[0], b.target[0], t), lerp(a.target[1], b.target[1], t), lerp(a.target[2], b.target[2], t)],
  }
}
