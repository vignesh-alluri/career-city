import { describe, expect, it } from 'vitest'
import { makeApplication, makeReminder } from '@/test/factories'
import { activitySummary, applicationsOverTime, conversionRates, statusDistribution, weeklyActivity } from './analytics'

const NOW = new Date(2026, 10, 19, 12, 0, 0) // Thursday 19 Nov 2026; its week starts on Monday 16 Nov

describe('statusDistribution', () => {
  it('lists every status in pipeline order, including those with zero', () => {
    const d = statusDistribution([makeApplication({ status: 'applied' }), makeApplication({ status: 'applied' }), makeApplication({ status: 'rejected' })])
    expect(d).toHaveLength(7)
    expect(d[0]).toEqual({ status: 'saved', label: 'Saved', count: 0 })
    expect(d.find((x) => x.status === 'applied')?.count).toBe(2)
    expect(d.reduce((n, x) => n + x.count, 0)).toBe(3)
  })
})

describe('conversionRates', () => {
  it('returns null rates (not 0%) when nothing has been submitted', () => {
    const c = conversionRates([makeApplication({ status: 'saved' })], [])
    expect(c).toEqual({ submitted: 0, interviewed: 0, offered: 0, interviewRate: null, offerRate: null })
  })

  it('ignores saved applications in the denominator', () => {
    const c = conversionRates([makeApplication({ status: 'saved' }), makeApplication({ status: 'applied' })], [])
    expect(c.submitted).toBe(1)
  })

  it('counts interview, offered and accepted as having reached an interview', () => {
    const apps = ['applied', 'interview', 'offered', 'accepted'].map((status) => makeApplication({ status: status as 'applied' }))
    const c = conversionRates(apps, [])
    expect(c.submitted).toBe(4)
    expect(c.interviewed).toBe(3)
    expect(c.interviewRate).toBeCloseTo(0.75)
    expect(c.offered).toBe(2)
    expect(c.offerRate).toBeCloseTo(0.5)
  })

  it('counts a rejected application if an interview reminder was logged for it', () => {
    const rejected = makeApplication({ status: 'rejected' })
    const other = makeApplication({ status: 'rejected' })
    const c = conversionRates([rejected, other], [makeReminder({ type: 'interview', applicationId: rejected.id })])
    expect(c.interviewed).toBe(1)
  })

  it('does not count non-interview reminders, or reminders linked to no application', () => {
    const a = makeApplication({ status: 'applied' })
    const c = conversionRates([a], [makeReminder({ type: 'follow_up', applicationId: a.id }), makeReminder({ type: 'interview', applicationId: null })])
    expect(c.interviewed).toBe(0)
  })
})

describe('weeklyActivity', () => {
  it('returns one bucket per week, oldest first, labelled by the Monday', () => {
    const w = weeklyActivity([], NOW, 3)
    expect(w.map((x) => x.week)).toEqual(['2 Nov', '9 Nov', '16 Nov'])
    expect(w.every((x) => x.count === 0)).toBe(true)
  })

  it('puts an application in the week it was submitted (Monday starts the week, Sunday ends it)', () => {
    const apps = [
      makeApplication({ dateApplied: '2026-11-16' }), // Monday: this week
      makeApplication({ dateApplied: '2026-11-15' }), // Sunday: last week
      makeApplication({ dateApplied: '2026-11-09' }), // Monday: last week
    ]
    expect(weeklyActivity(apps, NOW, 3).map((x) => x.count)).toEqual([0, 2, 1])
  })

  it('ignores applications with no date and those older than the window', () => {
    const apps = [makeApplication({ dateApplied: null }), makeApplication({ dateApplied: '2026-01-01' })]
    expect(weeklyActivity(apps, NOW, 3).reduce((n, x) => n + x.count, 0)).toBe(0)
  })
})

describe('applicationsOverTime', () => {
  it('is a running total that never goes down', () => {
    const apps = [makeApplication({ dateApplied: '2026-11-03' }), makeApplication({ dateApplied: '2026-11-17' }), makeApplication({ dateApplied: '2026-11-18' })]
    expect(applicationsOverTime(apps, NOW, 3).map((x) => x.total)).toEqual([1, 1, 3])
  })

  it('starts from the applications made before the window, so the line does not begin at zero', () => {
    const apps = [makeApplication({ dateApplied: '2026-06-01' }), makeApplication({ dateApplied: '2026-10-01' }), makeApplication({ dateApplied: '2026-11-10' })]
    expect(applicationsOverTime(apps, NOW, 3).map((x) => x.total)).toEqual([2, 3, 3])
  })
})

describe('activitySummary', () => {
  it('handles an empty window', () => {
    expect(activitySummary([])).toEqual({ total: 0, average: 0, busiest: null })
  })

  it('has no busiest week when nothing happened', () => {
    expect(activitySummary([{ week: '2 Nov', count: 0 }, { week: '9 Nov', count: 0 }]).busiest).toBeNull()
  })

  it('adds up, averages to one decimal, and finds the busiest week', () => {
    const s = activitySummary([{ week: '2 Nov', count: 1 }, { week: '9 Nov', count: 3 }, { week: '16 Nov', count: 0 }])
    expect(s.total).toBe(4)
    expect(s.average).toBe(1.3)
    expect(s.busiest).toEqual({ week: '9 Nov', count: 3 })
  })

  it('names the first week when two are equally busy', () => {
    expect(activitySummary([{ week: 'a', count: 2 }, { week: 'b', count: 2 }]).busiest?.week).toBe('a')
  })
})
