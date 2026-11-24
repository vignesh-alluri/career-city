import { describe, expect, it } from 'vitest'
import { toHalfFloat } from './halfFloat'

/** The reverse conversion, written independently, so the test can check round trips and not only a few memorised codes. */
function fromHalf(h: number): number {
  const sign = h & 0x8000 ? -1 : 1
  const exponent = (h >> 10) & 0x1f
  const fraction = h & 0x3ff
  if (exponent === 0) return sign * 2 ** -14 * (fraction / 1024)
  return sign * 2 ** (exponent - 15) * (1 + fraction / 1024)
}

describe('toHalfFloat', () => {
  it('matches the known codes for simple numbers', () => {
    expect(toHalfFloat(0)).toBe(0x0000)
    expect(toHalfFloat(1)).toBe(0x3c00)
    expect(toHalfFloat(0.5)).toBe(0x3800)
    expect(toHalfFloat(2)).toBe(0x4000)
    expect(toHalfFloat(-2)).toBe(0xc000)
  })

  it('round-trips water-sized heights to within half-float precision', () => {
    for (const v of [0.003, 0.05, 0.123, 0.5, 1.2, -0.07, -0.9, 1.99]) {
      const back = fromHalf(toHalfFloat(v))
      expect(Math.abs(back - v) / Math.abs(v)).toBeLessThan(0.001) // 10 fraction bits: better than 0.1% for normal numbers
    }
  })

  it('keeps the sign', () => {
    expect(fromHalf(toHalfFloat(-0.25))).toBe(-0.25)
    expect(toHalfFloat(-1) & 0x8000).toBe(0x8000)
  })

  it('turns numbers too small for the format into zero, and clamps huge ones', () => {
    expect(toHalfFloat(1e-9)).toBe(0)
    expect(toHalfFloat(1e9)).toBe(0x7bff)
    expect(toHalfFloat(-1e9)).toBe(0xfbff)
  })
})
