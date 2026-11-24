import { describe, expect, it } from 'vitest'
import { addDays, agendaDays, dayKey, filterEvents, groupByDay, isSameMonth, monthGrid, moveToDay, parseDayKey, shiftAnchor, startOfWeek, weekDays, weekdayLabels } from './calendarMath'

const nov = new Date(2026, 10, 18) // Wednesday 18 November 2026; 1 Nov 2026 is a Sunday

describe('day keys', () => {
  it('writes and reads days with leading zeros', () => {
    expect(dayKey(new Date(2026, 0, 5))).toBe('2026-01-05')
    expect(dayKey(parseDayKey('2026-12-31'))).toBe('2026-12-31')
  })
})

describe('monthGrid', () => {
  it('shows whole weeks starting on Monday (6 weeks for Nov 2026)', () => {
    const days = monthGrid(nov, 1)
    expect(days).toHaveLength(42)
    expect(dayKey(days[0])).toBe('2026-10-26')
    expect(dayKey(days[41])).toBe('2026-12-06')
  })

  it('shows whole weeks starting on Sunday (5 weeks for Nov 2026)', () => {
    const days = monthGrid(nov, 0)
    expect(days).toHaveLength(35)
    expect(dayKey(days[0])).toBe('2026-11-01')
    expect(dayKey(days[34])).toBe('2026-12-05')
  })

  it('always covers every day of the month and a multiple of 7 days', () => {
    for (let m = 0; m < 12; m++) {
      for (const ws of [0, 1] as const) {
        const days = monthGrid(new Date(2026, m, 10), ws)
        expect(days.length % 7).toBe(0)
        const keys = new Set(days.map(dayKey))
        for (let d = 1; d <= new Date(2026, m + 1, 0).getDate(); d++) expect(keys.has(dayKey(new Date(2026, m, d)))).toBe(true)
        expect(days[0].getDay()).toBe(ws)
      }
    }
  })
})

describe('weeks', () => {
  it('finds the start of the week for either convention', () => {
    expect(dayKey(startOfWeek(nov, 1))).toBe('2026-11-16')
    expect(dayKey(startOfWeek(nov, 0))).toBe('2026-11-15')
    expect(dayKey(startOfWeek(new Date(2026, 10, 15), 1))).toBe('2026-11-09') // a Sunday belongs to the week before when weeks start Monday
  })

  it('lists seven days and matching labels', () => {
    expect(weekDays(nov, 1).map((d) => d.getDate())).toEqual([16, 17, 18, 19, 20, 21, 22])
    expect(weekdayLabels(1)).toEqual(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'])
    expect(weekdayLabels(0)[0]).toBe('Sun')
  })

  it('lists the agenda days from the anchor', () => {
    const days = agendaDays(nov, 5)
    expect(days).toHaveLength(5)
    expect(dayKey(days[4])).toBe('2026-11-22')
  })
})

describe('events', () => {
  const e = (id: string, date: Date, kind = 'interview', completed = false) => ({ id, date, kind, completed })

  it('groups events by day, keeping order', () => {
    const map = groupByDay([e('a', new Date(2026, 10, 20, 9)), e('b', new Date(2026, 10, 20, 15)), e('c', new Date(2026, 10, 21, 9))])
    expect(map.get('2026-11-20')?.map((x) => x.id)).toEqual(['a', 'b'])
    expect(map.get('2026-11-21')?.map((x) => x.id)).toEqual(['c'])
  })

  it('filters by type and hides completed events when asked', () => {
    const list = [e('a', nov, 'interview'), e('b', nov, 'deadline'), e('c', nov, 'interview', true)]
    expect(filterEvents(list, new Set(['interview']), true).map((x) => x.id)).toEqual(['a', 'c'])
    expect(filterEvents(list, new Set(['interview']), false).map((x) => x.id)).toEqual(['a'])
    expect(filterEvents(list, new Set(), true)).toHaveLength(0)
  })
})

describe('moveToDay', () => {
  it('moves to another day and keeps the time of day', () => {
    const original = new Date(2026, 10, 20, 9, 30).toISOString()
    expect(moveToDay(original, '2026-11-25')).toBe(new Date(2026, 10, 25, 9, 30).toISOString())
  })

  it('works across months and years', () => {
    const original = new Date(2026, 11, 30, 17, 5).toISOString()
    expect(moveToDay(original, '2027-01-02')).toBe(new Date(2027, 0, 2, 17, 5).toISOString())
  })
})

describe('shiftAnchor', () => {
  it('moves by a month, a week or two weeks', () => {
    expect(dayKey(shiftAnchor('month', nov, 1))).toBe('2026-12-01')
    expect(dayKey(shiftAnchor('month', new Date(2026, 11, 15), 1))).toBe('2027-01-01')
    expect(dayKey(shiftAnchor('month', new Date(2026, 0, 15), -1))).toBe('2025-12-01')
    expect(dayKey(shiftAnchor('week', nov, 1))).toBe('2026-11-25')
    expect(dayKey(shiftAnchor('agenda', nov, -1))).toBe('2026-11-04')
  })

  it('addDays and isSameMonth agree about month ends', () => {
    expect(dayKey(addDays(new Date(2026, 10, 30), 1))).toBe('2026-12-01')
    expect(isSameMonth(new Date(2026, 10, 30), new Date(2026, 10, 1))).toBe(true)
    expect(isSameMonth(new Date(2026, 10, 30), new Date(2026, 11, 1))).toBe(false)
  })
})
