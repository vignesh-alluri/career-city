import { describe, expect, it } from 'vitest'
import { adaptiveDpr, planEffects } from './effects'

describe('planEffects', () => {
  it('gives a computer everything when the setting is auto and it has not slowed down', () => {
    const p = planEffects('high', 'auto', false)
    expect(p).toEqual({ lite: false, reflections: true, waterCells: 256, rainStreaks: 900, maxDpr: 1.5 })
  })

  it('switches the expensive effects off once auto mode has measured a slowdown', () => {
    const p = planEffects('high', 'auto', true)
    expect(p.lite).toBe(true)
    expect(p.reflections).toBe(false)
    expect(p.waterCells).toBeLessThan(256)
  })

  it('"light" is always light, and "full" never lightens, whatever was measured', () => {
    expect(planEffects('high', 'light', false).reflections).toBe(false)
    expect(planEffects('high', 'full', true).reflections).toBe(true)
    expect(planEffects('high', 'full', true).waterCells).toBe(256)
  })

  it('phones and touch screens always get the cheap version', () => {
    for (const setting of ['auto', 'full', 'light'] as const) {
      const p = planEffects('low', setting, false)
      expect(p.reflections).toBe(false)
      expect(p.maxDpr).toBe(1)
    }
  })

  it('the cheap version really is cheaper', () => {
    const full = planEffects('high', 'full', false), light = planEffects('high', 'light', false)
    expect(light.waterCells * light.waterCells).toBeLessThan(full.waterCells * full.waterCells / 3)
    expect(light.rainStreaks).toBeLessThan(full.rainStreaks)
    expect(light.maxDpr).toBeLessThan(full.maxDpr)
  })
})

describe('adaptiveDpr', () => {
  it('uses the full density when comfortable and one pixel per CSS pixel when struggling', () => {
    expect(adaptiveDpr(1, 1.5)).toBe(1.5)
    expect(adaptiveDpr(0, 1.5)).toBe(1)
  })

  it('moves smoothly in between, in steps of 0.05', () => {
    expect(adaptiveDpr(0.5, 1.5)).toBe(1.25)
    expect(adaptiveDpr(0.3, 1.5)).toBe(1.15)
  })

  it('never goes below 1 or above the maximum, even for out-of-range input', () => {
    expect(adaptiveDpr(-3, 1.5)).toBe(1)
    expect(adaptiveDpr(9, 1.5)).toBe(1.5)
    expect(adaptiveDpr(0.7, 1)).toBe(1)
  })
})
