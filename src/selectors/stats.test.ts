import { describe, expect, it } from 'vitest'
import { makeApplication, makeReminder } from '@/test/factories'
import { computeStats, upcomingDeadlines } from './stats'

const now = new Date(2026, 10, 15, 12, 0, 0) // 15 Nov 2026, local time (month is 0-based)

describe('upcomingDeadlines', () => {
  it('includes today and exactly 14 days ahead, excludes yesterday and day 15', () => {
    const apps = [
      makeApplication({ deadline: '2026-11-14' }), // yesterday: out
      makeApplication({ deadline: '2026-11-15' }), // today: in
      makeApplication({ deadline: '2026-11-29' }), // +14 days: in
      makeApplication({ deadline: '2026-11-30' }), // +15 days: out
    ]
    expect(upcomingDeadlines(apps, now).map((a) => a.deadline)).toEqual(['2026-11-15', '2026-11-29'])
  })

  it('only looks at saved roles, and sorts soonest first', () => {
    const apps = [
      makeApplication({ deadline: '2026-11-25' }),
      makeApplication({ deadline: '2026-11-18' }),
      makeApplication({ status: 'applied', dateApplied: '2026-11-01', deadline: '2026-11-17' }),
    ]
    expect(upcomingDeadlines(apps, now).map((a) => a.deadline)).toEqual(['2026-11-18', '2026-11-25'])
  })
})

describe('computeStats', () => {
  const apps = [
    makeApplication({ status: 'saved', deadline: '2026-11-20' }),
    makeApplication({ status: 'saved', deadline: '2026-12-30' }),
    makeApplication({ status: 'saved' }),
    makeApplication({ status: 'applied', dateApplied: '2026-11-01' }),
    makeApplication({ status: 'assessment', dateApplied: '2026-11-01' }),
    makeApplication({ status: 'interview', dateApplied: '2026-11-01' }),
    makeApplication({ status: 'offered', dateApplied: '2026-11-01' }),
    makeApplication({ status: 'accepted', dateApplied: '2026-11-01' }),
    makeApplication({ status: 'rejected', dateApplied: '2026-11-01' }),
  ]
  const reminders = [
    makeReminder({ type: 'interview', dueAt: '2026-11-20T10:00:00Z' }),
    makeReminder({ type: 'interview', dueAt: '2026-11-10T10:00:00Z' }),
    makeReminder({ type: 'interview', dueAt: '2026-11-21T10:00:00Z', completed: true }),
    makeReminder({ type: 'follow_up', dueAt: '2026-11-20T10:00:00Z' }),
  ]

  it('follows the definitions shown on the dashboard', () => {
    expect(computeStats(apps, reminders, now)).toEqual({
      total: 6,               // everything except the 3 saved roles
      saved: 3,
      active: 3,              // applied + assessment + interview
      interviewsScheduled: 1, // only the future, unfinished interview reminder
      offers: 2,              // offered + accepted
      rejections: 1,
      upcomingDeadlines: 1,   // only the saved role due on 20 Nov
    })
  })

  it('is all zeros for a new account', () => {
    expect(Object.values(computeStats([], [], now)).every((n) => n === 0)).toBe(true)
  })
})
