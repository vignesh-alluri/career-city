import { describe, expect, it } from 'vitest'
import type { ApplicationStatus } from '@/types'
import { makeApplication, makeReminder } from '@/test/factories'
import { computeCityMetrics } from './city'

const now = new Date('2026-11-15T12:00:00Z')
const apps = (...statuses: ApplicationStatus[]) => statuses.map((status) => makeApplication({ status }))

describe('computeCityMetrics', () => {
  it('maps each status to the district it builds', () => {
    const m = computeCityMetrics(apps('saved', 'saved', 'applied', 'assessment', 'interview', 'offered', 'accepted', 'rejected', 'rejected'), [], now)
    expect(m.counts).toEqual({ discovery: 2, application: 2, interview: 1, achievement: 2, analytics: 9 })
    expect(m.rejected).toBe(2)
    expect(m.total).toBe(9)
  })

  it('returns an empty city for no data', () => {
    const m = computeCityMetrics([], [], now)
    expect(Object.values(m.counts).every((n) => n === 0)).toBe(true)
    expect(m.total).toBe(0)
  })

  it('counts only future, unfinished interview reminders', () => {
    const m = computeCityMetrics([], [
      makeReminder({ type: 'interview', dueAt: '2026-11-20T10:00:00Z' }),
      makeReminder({ type: 'interview', dueAt: '2026-11-10T10:00:00Z' }),
      makeReminder({ type: 'interview', dueAt: '2026-11-21T10:00:00Z', completed: true }),
      makeReminder({ type: 'follow_up', dueAt: '2026-11-20T10:00:00Z' }),
    ], now)
    expect(m.upcomingInterviews).toBe(1)
  })
})
