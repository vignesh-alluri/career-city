import { describe, expect, it } from 'vitest'
import { describeWater } from './waterStatus'
import { mergeBounds } from './waterSurface'

describe('mergeBounds', () => {
  it('is nothing when both are missing', () => {
    expect(mergeBounds(null, null, 2, 100, 100)).toBeNull()
  })

  it('grows a single rectangle by the margin', () => {
    expect(mergeBounds(null, { x0: 10, y0: 20, x1: 30, y1: 40 }, 2, 100, 100)).toEqual({ x0: 8, y0: 18, x1: 32, y1: 42 })
  })

  it('covers both rectangles', () => {
    expect(mergeBounds({ x0: 10, y0: 10, x1: 20, y1: 20 }, { x0: 50, y0: 5, x1: 60, y1: 15 }, 0, 100, 100)).toEqual({ x0: 10, y0: 5, x1: 60, y1: 20 })
  })

  it('never leaves the grid', () => {
    expect(mergeBounds({ x0: 0, y0: 0, x1: 99, y1: 99 }, null, 5, 100, 100)).toEqual({ x0: 0, y0: 0, x1: 99, y1: 99 })
  })
})

describe('describeWater', () => {
  it('says plainly what is running', () => {
    expect(describeWater({ kind: 'off', cell: 0, steppedDown: false })).toBe('Not running on this page.')
    expect(describeWater({ kind: 'gl', cell: 4, steppedDown: false })).toBe('smooth, on the graphics card, 4 px cells.')
    expect(describeWater({ kind: 'gl', cell: 8, steppedDown: true })).toContain('reduced because frames were slow')
    expect(describeWater({ kind: '2d', cell: 5, steppedDown: false })).toContain('no WebGL 2')
  })
})
