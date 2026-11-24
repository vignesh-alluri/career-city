import { describe, expect, it } from 'vitest'
import { WINDOW_COLORS } from '../config/palette'
import { generateDistrictGeometry } from './buildingLayout'
import { buildingTheme, generateWindows } from './windows'

const { boxes } = generateDistrictGeometry('interview', 'campus', 'high')

describe('buildingTheme', () => {
  it('gives the same building the same theme every time', () => {
    for (let i = 0; i < 20; i++) expect(buildingTheme(42, i)).toBe(buildingTheme(42, i))
  })

  it('uses a variety of themes across a district', () => {
    const themes = new Set(Array.from({ length: 100 }, (_, i) => buildingTheme(42, i)))
    expect(themes.size).toBeGreaterThanOrEqual(4)
  })
})

describe('generateWindows', () => {
  it('is deterministic', () => {
    expect(generateWindows(boxes, 0.5, 9)).toEqual(generateWindows(boxes, 0.5, 9))
  })

  it('creates no windows when nothing is lit, and more when more is lit', () => {
    expect(generateWindows(boxes, 0, 9)).toHaveLength(0)
    expect(generateWindows(boxes, 0.8, 9).length).toBeGreaterThan(generateWindows(boxes, 0.2, 9).length)
  })

  it('only uses colours that exist (the extra index is the district colour)', () => {
    for (const w of generateWindows(boxes, 0.5, 9)) {
      expect(Number.isInteger(w.tone)).toBe(true)
      expect(w.tone).toBeGreaterThanOrEqual(0)
      expect(w.tone).toBeLessThanOrEqual(WINDOW_COLORS.length)
    }
  })

  it('keeps windows above the ground', () => {
    for (const w of generateWindows(boxes, 0.5, 9)) expect(w.y).toBeGreaterThanOrEqual(0.3)
  })
})
