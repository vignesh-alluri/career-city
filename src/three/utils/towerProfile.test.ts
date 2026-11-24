import { describe, expect, it } from 'vitest'
import { TOWER, TOWER_TOP, towerHalfWidthAt } from './towerProfile'

describe('towerHalfWidthAt', () => {
  it('is as wide as the base at the bottom and as narrow as the top deck at the top', () => {
    expect(towerHalfWidthAt(0)).toBeCloseTo(TOWER.baseHalf, 6)
    expect(towerHalfWidthAt(TOWER.topY)).toBeCloseTo(TOWER.topHalf, 6)
  })

  it('narrows steadily all the way up', () => {
    let previous = Infinity
    for (let y = 0; y <= TOWER.topY; y += 0.2) {
      const w = towerHalfWidthAt(y)
      expect(w).toBeLessThanOrEqual(previous)
      previous = w
    }
  })

  it('curves inward like the real legs: far narrower than a straight line at the main deck', () => {
    const straight = TOWER.baseHalf + (TOWER.topHalf - TOWER.baseHalf) * (TOWER.mainY / TOWER.topY)
    expect(towerHalfWidthAt(TOWER.mainY)).toBeLessThan(straight * 0.6)
  })

  it('does not extend past its ends', () => {
    expect(towerHalfWidthAt(-5)).toBe(towerHalfWidthAt(0))
    expect(towerHalfWidthAt(50)).toBe(towerHalfWidthAt(TOWER.topY))
  })
})

describe('tower layout', () => {
  it('has rings from the ground to the top deck, in order, including the main deck', () => {
    const rings = [...TOWER.ringHeights]
    expect(rings[0]).toBe(0)
    expect(rings[rings.length - 1]).toBe(TOWER.topY)
    expect(rings.includes(TOWER.mainY)).toBe(true)
    for (let i = 1; i < rings.length; i++) expect(rings[i]).toBeGreaterThan(rings[i - 1])
  })

  it('puts the antenna tip above the top deck', () => {
    expect(TOWER_TOP).toBeGreaterThan(TOWER.topY)
  })
})
