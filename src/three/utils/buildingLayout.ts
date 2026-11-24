import type { CityQuality, DistrictId } from '@/types'
import type { Profile, Vec3 } from '../config/layout'
import { createRng, hashString } from './random'

/** One building: a box centred at (x, z) standing on the ground, h tall. */
export interface BoxSpec {
  x: number; z: number; w: number; d: number; h: number
  /** Height of the bottom of this block above the ground. Rooftop blocks sit on top of another block (default 0). */
  y0?: number
  /** True if a smaller block is stacked on top of this one. */
  capped?: boolean
}

// Sizes snap to a coarse grid so every building is made of chunky, whole "voxel" steps.
const snap = (v: number, step: number) => Math.max(step, Math.round(v / step) * step)
const snapAny = (v: number, step: number) => Math.round(v / step) * step

export interface DistrictGeometry {
  boxes: BoxSpec[]
  /** How many boxes at the start of `boxes` belong to the district landmark. */
  landmarkCount: number
  /** Where the landmark's decoration (lens, antenna...) sits: the top of the landmark. */
  crown: Vec3
}

/**
 * Procedurally generates the buildings of one district on a grid.
 * Inspired by the dense night-skyline reference: many tightly packed blocks, a few needle towers, small gaps for streets.
 */
export function generateDistrictGeometry(id: DistrictId, profile: Profile, quality: CityQuality): DistrictGeometry {
  const rng = createRng(hashString(id))
  const dense = quality === 'high'
  const n = dense ? 6 : 4
  const cell = dense ? 0.95 : 1.3
  const coords = Array.from({ length: n }, (_, i) => (i - (n - 1) / 2) * cell)
  const extent = coords[n - 1]
  const lm = dense ? 1.7 : 2.0 // landmark footprint
  const boxes: BoxSpec[] = []
  let crown: Vec3 = [0, 0, 0]

  const hasLandmark = profile !== 'bars'
  if (hasLandmark) {
    switch (profile) {
      case 'market': boxes.push({ x: 0, z: 0, w: lm * 0.8, d: lm * 0.8, h: 2.4 }); crown = [0, 2.4, 0]; break
      case 'towers': boxes.push({ x: 0, z: 0, w: lm * 0.75, d: lm * 0.75, h: 5.6 }); crown = [0, 5.6, 0]; break
      case 'campus': boxes.push({ x: 0, z: 0, w: lm * 0.85, d: lm * 0.85, h: 3.8 }); crown = [0, 3.8, 0]; break
      case 'monument':
        // three stacked boxes, each narrower and taller: a stepped ziggurat
        boxes.push({ x: 0, z: 0, w: lm, d: lm, h: 1.5 })
        boxes.push({ x: 0, z: 0, w: lm * 0.75, d: lm * 0.75, h: 3.0 })
        boxes.push({ x: 0, z: 0, w: lm * 0.5, d: lm * 0.5, h: 4.5 })
        crown = [0, 4.5, 0]
        break
    }
  }

  const landmarkCount = boxes.length
  let tallest = 0
  for (const gx of coords) {
    for (const gz of coords) {
      if (hasLandmark && Math.abs(gx) < cell * 0.8 && Math.abs(gz) < cell * 0.8) continue // keep the centre free for the landmark
      const skip = rng() < 0.08 // random gaps read as streets
      let w = cell * (0.62 + rng() * 0.28)
      let d = cell * (0.62 + rng() * 0.28)
      let jx = (rng() - 0.5) * (cell - w) * 0.6
      let jz = (rng() - 0.5) * (cell - d) * 0.6
      const r = Math.hypot(gx, gz) / Math.hypot(extent, extent) // 0 at centre, 1 at corner
      let h: number
      switch (profile) {
        case 'market': h = 0.5 + rng() * 1.2; break
        case 'towers': h = 1.6 + rng() * 2.6 + (1 - r) * 1.6; break
        case 'campus': h = 1.0 + rng() * 1.8; break
        case 'bars':
          w = d = cell * 0.55; jx = jz = 0
          h = 0.8 + ((gx + extent) / (2 * extent)) * 3.4 + rng() * 0.3 // grows left to right
          break
        default: h = 0.8 + rng() * 1.6
      }
      if (profile !== 'bars' && rng() < 0.07) h *= 1.7 // the occasional needle tower
      if (skip && profile !== 'bars') continue
      w = snap(w, 0.2); d = snap(d, 0.2); h = snap(h, 0.4)
      const main: BoxSpec = { x: gx + snapAny(jx, 0.1), z: gz + snapAny(jz, 0.1), w, d, h }
      if (profile !== 'bars' && h >= 1.6 && rng() < 0.55) {
        // a smaller block on the roof, like the stepped tops of the buildings in the reference
        main.capped = true
        boxes.push(main)
        boxes.push({ x: main.x, z: main.z, w: snap(w * 0.6, 0.2), d: snap(d * 0.6, 0.2), h: snap(h * 0.3, 0.4), y0: h })
      } else {
        boxes.push(main)
      }
      if (profile === 'bars' && h > tallest) { tallest = h; crown = [gx, h, gz] }
    }
  }
  return { boxes, crown, landmarkCount }
}
