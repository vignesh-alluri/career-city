import { describe, expect, it } from 'vitest'
import { litCars } from './meter'

describe('litCars', () => {
  it('lights none when there is nothing to measure', () => {
    expect(litCars(null)).toBe(0)
    expect(litCars(Number.NaN)).toBe(0)
  })

  it('rounds the rate to the nearest car', () => {
    expect(litCars(0)).toBe(0)
    expect(litCars(0.04)).toBe(0)
    expect(litCars(0.05)).toBe(1) // 0.5 of a car rounds up
    expect(litCars(0.34)).toBe(3)
    expect(litCars(1)).toBe(10)
  })

  it('stays between none and all, even for out-of-range input', () => {
    expect(litCars(-0.5)).toBe(0)
    expect(litCars(2)).toBe(10)
  })

  it('works for any train length', () => {
    expect(litCars(0.5, 6)).toBe(3)
    expect(litCars(1, 4)).toBe(4)
  })
})
