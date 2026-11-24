import { describe, expect, it } from 'vitest'
import { makeApplication, makeReminder } from '@/test/factories'
import { dayLabel, nextDeparture } from './nextDeparture'

const NOW = new Date(2026, 10, 20, 10, 0, 0) // Fri 20 Nov 2026, 10:00
const at = (d: number, h = 9, m = 0) => new Date(2026, 10, d, h, m).toISOString()

describe('nextDeparture', () => {
  it('is null when nothing is coming up', () => {
    expect(nextDeparture([], [], NOW)).toBeNull()
  })

  it('picks the soonest of reminders and deadlines together', () => {
    const app = makeApplication({ status: 'saved', company: 'Sony', deadline: '2026-11-25' })
    const r = makeReminder({ title: 'Call', dueAt: at(22) })
    const d = nextDeparture([app], [r], NOW)!
    expect(d.kind).toBe('reminder')
    expect(d.title).toBe('Call')
    expect(nextDeparture([app], [makeReminder({ dueAt: at(28) })], NOW)!.kind).toBe('deadline')
  })

  it('ignores completed reminders and reminders already in the past', () => {
    const done = makeReminder({ dueAt: at(21), completed: true })
    const past = makeReminder({ dueAt: at(19) })
    const earlierToday = makeReminder({ dueAt: at(20, 8, 0) })
    expect(nextDeparture([], [done, past, earlierToday], NOW)).toBeNull()
  })

  it('counts a deadline today (it is all day) but not one that has passed', () => {
    expect(nextDeparture([makeApplication({ status: 'saved', deadline: '2026-11-20' })], [], NOW)!.hasTime).toBe(false)
    expect(nextDeparture([makeApplication({ status: 'saved', deadline: '2026-11-19' })], [], NOW)).toBeNull()
  })

  it('only counts deadlines of saved roles', () => {
    expect(nextDeparture([makeApplication({ status: 'applied', deadline: '2026-11-25' })], [], NOW)).toBeNull()
  })

  it('names the company on a reminder linked to an application', () => {
    const app = makeApplication({ company: 'Acme' })
    const d = nextDeparture([app], [makeReminder({ type: 'interview', applicationId: app.id, dueAt: at(23) })], NOW)!
    expect(d.detail).toBe('Interview, Acme')
    expect(d.applicationId).toBe(app.id)
  })
})

describe('dayLabel', () => {
  it('speaks in calendar days', () => {
    expect(dayLabel(new Date(2026, 10, 20, 23, 0), NOW)).toBe('today')
    expect(dayLabel(new Date(2026, 10, 21, 0, 30), NOW)).toBe('tomorrow')
    expect(dayLabel(new Date(2026, 10, 25, 9, 0), NOW)).toBe('in 5 days')
  })
})
