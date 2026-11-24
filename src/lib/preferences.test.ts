import { describe, expect, it } from 'vitest'
import { DEFAULT_PREFERENCES, sanitizePreferences } from './preferences'

describe('sanitizePreferences', () => {
  it('gives the defaults for anything that is not an object', () => {
    for (const bad of [null, undefined, 42, 'x', [], true]) expect(sanitizePreferences(bad)).toEqual(DEFAULT_PREFERENCES)
  })

  it('keeps valid values', () => {
    const mine = { accent: 'violet', palette: 'night', density: 'compact', weekStartsOn: 0, calendarView: 'agenda', waterCursor: false, waterStrength: 'subtle', cityEffects: 'light',
      dashboard: { stats: false, deadlines: true, upcoming: false }, boardHidden: ['rejected', 'accepted'] }
    expect(sanitizePreferences(mine)).toEqual(mine)
  })

  it('falls back field by field, so one bad value does not reset everything else', () => {
    const result = sanitizePreferences({ accent: 'hotpink', palette: 'neon', density: 'compact', weekStartsOn: 5, calendarView: 'year', waterCursor: 'yes', waterStrength: 'wild', cityEffects: 'ultra' })
    expect(result.accent).toBe(DEFAULT_PREFERENCES.accent)
    expect(result.palette).toBe('dusk')
    expect(result.density).toBe('compact')
    expect(result.weekStartsOn).toBe(1)
    expect(result.calendarView).toBe('month')
    expect(result.waterCursor).toBe(true)
    expect(result.cityEffects).toBe('auto')
    expect(result.waterStrength).toBe('normal')
  })

  it('keeps only real board statuses, once each', () => {
    expect(sanitizePreferences({ boardHidden: ['rejected', 'nonsense', 'rejected', 7, 'saved'] }).boardHidden).toEqual(['rejected', 'saved'])
    expect(sanitizePreferences({ boardHidden: 'rejected' }).boardHidden).toEqual([])
  })

  it('never shares the default objects, so changing one result cannot change the defaults', () => {
    const a = sanitizePreferences(null)
    a.dashboard.stats = false
    a.boardHidden.push('saved')
    expect(DEFAULT_PREFERENCES.dashboard.stats).toBe(true)
    expect(DEFAULT_PREFERENCES.boardHidden).toEqual([])
  })
})
