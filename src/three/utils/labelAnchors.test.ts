import { describe, expect, it } from 'vitest'
import { DISTRICT_BY_ID } from '@/config/districts'
import { DISTRICT_LAYOUTS, DISTRICT_RADIUS } from '../config/layout'
import { generateDistrictGeometry } from './buildingLayout'
import { labelAnchors } from './labelAnchors'
import { placeSigns } from './signPlacement'
import { hashString } from './random'

const anchors = labelAnchors('high')

describe('labelAnchors', () => {
  it('gives every district exactly one anchor', () => {
    expect(anchors.map((a) => a.id).sort()).toEqual(DISTRICT_LAYOUTS.map((l) => l.id).sort())
  })

  it('is deterministic', () => {
    expect(labelAnchors('high')).toEqual(anchors)
  })

  it('hangs each label above the top of its district tallest rooftop sign', () => {
    for (const l of DISTRICT_LAYOUTS) {
      const g = generateDistrictGeometry(l.id, l.profile, 'high')
      const info = DISTRICT_BY_ID[l.id]
      const signs = placeSigns(g.boxes, info.signs, info.color, hashString(l.id) + 1, 6, g.landmarkCount)
      const signTop = Math.max(0, ...signs.map((s) => s.y + s.h / 2))
      const anchor = anchors.find((a) => a.id === l.id)!
      expect(anchor.world[1] - 0.2).toBeGreaterThan(signTop) // anchor is in world height, which includes the 0.2 platform
    }
  })

  it('hangs over its own district: within the footprint of its platform', () => {
    for (const l of DISTRICT_LAYOUTS) {
      const a = anchors.find((x) => x.id === l.id)!
      expect(Math.hypot(a.world[0] - l.position[0], a.world[2] - l.position[2])).toBeLessThan(DISTRICT_RADIUS)
    }
  })
})
