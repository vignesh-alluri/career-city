import { describe, expect, it } from 'vitest'
import type { SignSpec } from './signPlacement'
import { buildSignBoxes, type Glyph } from './signPixels'

// a tiny 4 x 4 glyph with 6 lit pixels, so no browser is needed
const glyph: Glyph = { cols: 4, rows: 4, lit: [1, 0, 0, 1, 0, 1, 1, 0, 0, 0, 0, 0, 1, 1, 0, 0] }
const sign: SignSpec = { x: 1, z: 2, y: 3, w: 0.5, h: 1.2, word: 'X', color: '#38BDF8', style: 'neon' }
const lit = Array.from(glyph.lit).filter(Boolean).length

describe('buildSignBoxes', () => {
  it('builds a board, two frames and the lettering on both faces', () => {
    // 1 board + 2 faces x 4 frame bars + 2 faces x lit pixels
    expect(buildSignBoxes([sign], () => glyph, 0)).toHaveLength(1 + 8 + 2 * lit)
  })

  it('draws no pixels for an empty glyph, only the board and its frame', () => {
    const empty: Glyph = { cols: 4, rows: 4, lit: new Array(16).fill(0) }
    expect(buildSignBoxes([sign], () => empty, 0)).toHaveLength(9)
  })

  it('keeps every block of a sign around the sign\'s own position', () => {
    for (const b of buildSignBoxes([sign], () => glyph, 0.8)) {
      expect(Math.hypot(b.x - sign.x, b.z - sign.z)).toBeLessThan(0.5)
      expect(Math.abs(b.y - sign.y)).toBeLessThan(sign.h)
    }
  })

  it('turns every block to the sign\'s yaw', () => {
    for (const b of buildSignBoxes([sign], () => glyph, 0.8)) expect(b.ry).toBe(0.8)
  })

  it('scales with the number of signs', () => {
    expect(buildSignBoxes([sign, { ...sign, x: 5 }], () => glyph, 0)).toHaveLength(2 * (1 + 8 + 2 * lit))
  })
})
