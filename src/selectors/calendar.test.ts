import { describe, expect, it } from 'vitest'
import { makeApplication, makeReminder } from '@/test/factories'
import { buildEvents, rangeSummary, type CalendarEvent } from './calendar'

describe('buildEvents', () => {
  const saved = makeApplication({ company: 'Acme', role: 'Intern', status: 'saved', deadline: '2026-12-01' })
  const applied = makeApplication({ status: 'applied', dateApplied: '2026-11-01', deadline: '2026-11-10' })
  const noDeadline = makeApplication({})

  it('turns deadlines into events and skips applications without one', () => {
    const events = buildEvents([saved, applied, noDeadline], [])
    expect(events).toHaveLength(2)
    expect(events.every((e) => e.kind === 'deadline' && !e.hasTime && e.reminderId === null)).toBe(true)
  })

  it('marks a deadline as done once you have applied', () => {
    const events = buildEvents([saved, applied], [])
    expect(events.find((e) => e.applicationId === saved.id)?.completed).toBe(false)
    expect(events.find((e) => e.applicationId === applied.id)?.completed).toBe(true)
  })

  it('writes a readable deadline title', () => {
    expect(buildEvents([saved], [])[0].title).toBe('Deadline: Acme, Intern')
  })

  it('merges reminders with deadlines in date order', () => {
    const early = makeReminder({ type: 'interview', title: 'Phone screen', dueAt: '2026-11-05T09:00:00.000Z' })
    const late = makeReminder({ type: 'follow_up', title: 'Follow up', dueAt: '2026-12-20T09:00:00.000Z' })
    const events = buildEvents([saved, applied], [late, early])
    expect(events.map((e) => e.title)).toEqual(['Phone screen', `Deadline: ${applied.company}, ${applied.role}`, 'Deadline: Acme, Intern', 'Follow up'])
    expect(events.find((e) => e.title === 'Phone screen')?.hasTime).toBe(true)
  })
})

describe('rangeSummary', () => {
  const ev = (day: number, kind: CalendarEvent['kind'], completed = false, month = 10): CalendarEvent => ({
    id: `${month}-${day}${kind}`, date: new Date(2026, month, day, 9, 0), kind, title: 't', applicationId: null, reminderId: null, completed, hasTime: true,
  })
  const events = [ev(2, 'deadline'), ev(10, 'interview', true), ev(10, 'follow_up'), ev(28, 'deadline'), ev(5, 'interview', false, 11)]

  it('counts only the events inside the range, ends included', () => {
    const s = rangeSummary(events, new Date(2026, 10, 10, 0, 0), new Date(2026, 10, 30, 23, 59))
    expect(s).toEqual({ total: 3, deadlines: 1, interviews: 1, done: 1 })
  })

  it('is all zeros for an empty stretch', () => {
    expect(rangeSummary(events, new Date(2027, 0, 1), new Date(2027, 0, 31))).toEqual({ total: 0, deadlines: 0, interviews: 0, done: 0 })
  })
})
