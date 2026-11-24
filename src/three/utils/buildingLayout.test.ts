import { describe, expect, it } from 'vitest'
import { generateDistrictGeometry } from './buildingLayout'

const onGrid = (v: number, step: number) => Math.abs(v / step - Math.round(v / step)) < 1e-6

describe('generateDistrictGeometry', () => {
  it('is deterministic: the same district is identical on every load', () => {
    expect(generateDistrictGeometry('application', 'towers', 'high')).toEqual(generateDistrictGeometry('application', 'towers', 'high'))
  })

  it('builds a smaller city on the low-quality (phone) path', () => {
    const high = generateDistrictGeometry('application', 'towers', 'high').boxes.length
    const low = generateDistrictGeometry('application', 'towers', 'low').boxes.length
    expect(low).toBeLessThan(high)
  })

  it('keeps every ordinary building on the chunky grid (landmarks are exempt)', () => {
    const g = generateDistrictGeometry('application', 'towers', 'high')
    expect(g.landmarkCount).toBe(1)
    for (const b of g.boxes.slice(g.landmarkCount)) {
      expect(onGrid(b.h, 0.4)).toBe(true)
      expect(onGrid(b.w, 0.2)).toBe(true)
      expect(onGrid(b.d, 0.2)).toBe(true)
    }
  })

  it('places each rooftop block exactly on top of the building before it, and flags that building', () => {
    const { boxes } = generateDistrictGeometry('application', 'towers', 'high')
    const caps = boxes.map((b, i) => ({ b, i })).filter(({ b }) => b.y0)
    expect(caps.length).toBeGreaterThan(0)
    for (const { b, i } of caps) {
      expect(boxes[i - 1].capped).toBe(true)
      expect(b.y0).toBe(boxes[i - 1].h)
      expect(b.x).toBe(boxes[i - 1].x)
      expect(b.z).toBe(boxes[i - 1].z)
    }
  })
})
