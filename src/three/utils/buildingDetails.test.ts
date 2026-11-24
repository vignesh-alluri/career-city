import { describe, expect, it } from 'vitest'
import { generateDistrictGeometry } from './buildingLayout'
import { buildDetails } from './buildingDetails'
import { applyGrowth } from './cityGrowth'

const g = generateDistrictGeometry('application', 'towers', 'high')

describe('buildDetails', () => {
  it('is deterministic', () => {
    expect(buildDetails(g.boxes, 5, 'high')).toEqual(buildDetails(g.boxes, 5, 'high'))
  })

  it('adds fewer details on the low-quality (phone) path', () => {
    expect(buildDetails(g.boxes, 5, 'low').length).toBeLessThan(buildDetails(g.boxes, 5, 'high').length)
  })

  it('gives an empty account no details at all, because empty lots are bare ground', () => {
    const empty = applyGrowth(g.boxes, g.landmarkCount, 'towers', 0).boxes.slice(g.landmarkCount)
    expect(buildDetails(empty, 5, 'high')).toHaveLength(0)
  })

  it('details grow with the city: one more building means more details', () => {
    const at = (n: number) => buildDetails(applyGrowth(g.boxes, g.landmarkCount, 'towers', n).boxes, 5, 'high').length
    expect(at(8)).toBeGreaterThan(at(2))
  })

  it('keeps every detail above the ground, with a positive size', () => {
    for (const d of buildDetails(g.boxes, 5, 'high')) {
      expect(d.y - d.h / 2).toBeGreaterThanOrEqual(-1e-9)
      expect(d.w).toBeGreaterThan(0)
      expect(d.h).toBeGreaterThan(0)
      expect(d.d).toBeGreaterThan(0)
    }
  })

  it('puts machinery on the roof of the top-most block only', () => {
    const capped = g.boxes.findIndex((b) => b.capped)
    expect(capped).toBeGreaterThanOrEqual(0)
    const b = g.boxes[capped]
    // nothing but the wall details (ledges, corner strips, shopfront) may sit between the capped roof and its cap
    const onCappedRoof = buildDetails([b], 5, 'high').filter((d) => Math.abs(d.y - b.h) < 0.5 && d.y - d.h / 2 >= b.h)
    expect(onCappedRoof).toHaveLength(0)
  })
})
