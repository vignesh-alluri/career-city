import { describe, expect, it } from 'vitest'
import { generateDistrictGeometry } from './buildingLayout'
import { applyGrowth } from './cityGrowth'
import { placeSigns } from './signPlacement'

const g = generateDistrictGeometry('application', 'towers', 'high')
const words = ['AAA', 'BBB', 'CCC']
const place = (boxes = g.boxes, count = 6) => placeSigns(boxes, words, '#4D7CFF', 7, count, g.landmarkCount)

describe('placeSigns', () => {
  it('is deterministic', () => {
    expect(place()).toEqual(place())
  })

  it('never returns more signs than asked for', () => {
    expect(place(g.boxes, 3).length).toBeLessThanOrEqual(3)
    expect(place(g.boxes, 0)).toHaveLength(0)
  })

  it('keeps signs apart so they do not pile up', () => {
    const signs = place()
    for (let i = 0; i < signs.length; i++) {
      for (let j = i + 1; j < signs.length; j++) expect(Math.hypot(signs[i].x - signs[j].x, signs[i].z - signs[j].z)).toBeGreaterThanOrEqual(1.3)
    }
  })

  it('stands every sign on a roof, not inside a building', () => {
    for (const s of place()) {
      const roof = Math.max(...g.boxes.filter((b) => Math.abs(b.x - s.x) < 1e-9 && Math.abs(b.z - s.z) < 1e-9).map((b) => (b.y0 ?? 0) + b.h))
      expect(s.y - s.h / 2).toBeGreaterThanOrEqual(roof)
    }
  })

  it('leaves the landmark alone and puts no signs on empty lots', () => {
    expect(place(applyGrowth(g.boxes, g.landmarkCount, 'towers', 0).boxes)).toHaveLength(0)
    const landmark = g.boxes[0]
    expect(place().some((s) => s.x === landmark.x && s.z === landmark.z)).toBe(false)
  })

  it('cycles through the words', () => {
    expect(place().map((s) => s.word).slice(0, 4)).toEqual(['AAA', 'BBB', 'CCC', 'AAA'])
  })
})
