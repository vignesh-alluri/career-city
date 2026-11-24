import { describe, expect, it } from 'vitest'
import { clampLabel } from './labelLayout'

const inset = { left: 100, right: 100, top: 96, bottom: 56 }

describe('clampLabel', () => {
  it('leaves a label alone when it is comfortably inside the window', () => {
    expect(clampLabel(700, 400, 1920, 1080, inset)).toEqual({ x: 700, y: 400 })
  })

  it('pulls a label back from every edge', () => {
    expect(clampLabel(-50, 400, 1920, 1080, inset).x).toBe(100)
    expect(clampLabel(5000, 400, 1920, 1080, inset).x).toBe(1820)
    expect(clampLabel(700, -30, 1920, 1080, inset).y).toBe(96)
    expect(clampLabel(700, 9000, 1920, 1080, inset).y).toBe(1024)
  })

  it('centres the label if the window is too small for the margins', () => {
    expect(clampLabel(10, 10, 150, 100, inset)).toEqual({ x: 75, y: 50 })
  })
})
