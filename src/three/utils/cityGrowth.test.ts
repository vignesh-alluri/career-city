import { describe, expect, it } from 'vitest'
import { generateDistrictGeometry } from './buildingLayout'
import { applyGrowth } from './cityGrowth'

const g = generateDistrictGeometry('application', 'towers', 'high')
/** Indices of ordinary buildings that are actually built (not flat empty lots), skipping the landmark. */
const standing = (boxes: typeof g.boxes, landmarkCount = g.landmarkCount) =>
  boxes.map((b, i) => ({ b, i })).filter(({ b, i }) => i >= landmarkCount && !b.y0 && b.h > 0.2).map(({ i }) => i)

describe('applyGrowth', () => {
  it('shows the full demo city when there is no data (count undefined)', () => {
    const r = applyGrowth(g.boxes, g.landmarkCount, 'towers', undefined)
    expect(r.boxes).toEqual(g.boxes)
    expect(r.built).toBe(r.slots)
  })

  it('keeps only the landmark for an empty account', () => {
    const r = applyGrowth(g.boxes, g.landmarkCount, 'towers', 0)
    expect(r.built).toBe(0)
    expect(standing(r.boxes)).toHaveLength(0)
    expect(r.boxes.filter((b) => b.y0).every((b) => b.h < 0.05)).toBe(true) // rooftop blocks vanish with their building
    expect(r.boxes.slice(0, g.landmarkCount)).toEqual(g.boxes.slice(0, g.landmarkCount)) // the landmark is untouched
  })

  it('builds exactly one building per application', () => {
    for (const n of [1, 5, 12]) expect(standing(applyGrowth(g.boxes, g.landmarkCount, 'towers', n).boxes)).toHaveLength(n)
  })

  it('never reshuffles: same length and order at every count, so colours stay with their buildings', () => {
    for (const n of [0, 3, 40]) expect(applyGrowth(g.boxes, g.landmarkCount, 'towers', n).boxes).toHaveLength(g.boxes.length)
  })

  it('only grows: everything built at n is still built at n + 1', () => {
    for (let n = 0; n < 8; n++) {
      const before = new Set(standing(applyGrowth(g.boxes, g.landmarkCount, 'towers', n).boxes))
      const after = new Set(standing(applyGrowth(g.boxes, g.landmarkCount, 'towers', n + 1).boxes))
      for (const i of before) expect(after.has(i)).toBe(true)
    }
  })

  it('grows towers taller once every plot is used, but not shorter', () => {
    const full = applyGrowth(g.boxes, g.landmarkCount, 'towers', 1000)
    expect(full.built).toBe(full.slots)
    const heights = (boxes: typeof g.boxes) => standing(boxes).map((i) => boxes[i].h)
    const base = heights(g.boxes)
    const grown = heights(full.boxes)
    expect(grown.every((h, k) => h >= base[k])).toBe(true)
    expect(grown.some((h, k) => h > base[k])).toBe(true)
  })

  it('fills the analytics bar chart from left to right', () => {
    const bars = generateDistrictGeometry('analytics', 'bars', 'high')
    const r = applyGrowth(bars.boxes, bars.landmarkCount, 'bars', 3)
    const builtX = standing(r.boxes, bars.landmarkCount).map((i) => bars.boxes[i].x).sort((a, b) => a - b)
    const allX = bars.boxes.filter((_, i) => i >= bars.landmarkCount && !bars.boxes[i].y0).map((b) => b.x).sort((a, b) => a - b)
    expect(builtX).toEqual(allX.slice(0, 3))
  })
})
