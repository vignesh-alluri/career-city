import { describe, expect, it } from 'vitest'
import { ageLabel } from './format'

const NOW = new Date(2026, 10, 20, 15, 0, 0)

describe('ageLabel', () => {
  it('says today and yesterday', () => {
    expect(ageLabel('2026-11-20', NOW)).toBe('today')
    expect(ageLabel('2026-11-19', NOW)).toBe('yesterday')
  })

  it('counts days for the first two weeks', () => {
    expect(ageLabel('2026-11-15', NOW)).toBe('5 days ago')
    expect(ageLabel('2026-11-07', NOW)).toBe('13 days ago')
  })

  it('then weeks, then months', () => {
    expect(ageLabel('2026-11-06', NOW)).toBe('2 weeks ago')
    expect(ageLabel('2026-10-01', NOW)).toBe('7 weeks ago')
    expect(ageLabel('2026-08-01', NOW)).toBe('3 months ago')
  })

  it('treats a date in the future as today rather than a negative number', () => {
    expect(ageLabel('2026-12-25', NOW)).toBe('today')
  })
})
