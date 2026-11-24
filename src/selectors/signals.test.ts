import { describe, expect, it } from 'vitest'
import { makeApplication, makeReminder } from '@/test/factories'
import { deadlineSignal, reminderSignal } from './signals'

const NOW = new Date(2026, 10, 20, 10, 0, 0) // Friday 20 Nov 2026, 10:00

describe('deadlineSignal', () => {
  it('is green when nothing is due', () => {
    expect(deadlineSignal([], NOW)).toBe('green')
  })

  it('is amber when deadlines exist but none is close', () => {
    expect(deadlineSignal([makeApplication({ deadline: '2026-11-30' })], NOW)).toBe('amber')
    expect(deadlineSignal([makeApplication({ deadline: '2026-11-23' })], NOW)).toBe('amber') // 3 days away
  })

  it('is red when one is due within two days, including today', () => {
    expect(deadlineSignal([makeApplication({ deadline: '2026-11-20' })], NOW)).toBe('red')
    expect(deadlineSignal([makeApplication({ deadline: '2026-11-22' })], NOW)).toBe('red')
  })

  it('goes red as soon as ANY of them is close', () => {
    expect(deadlineSignal([makeApplication({ deadline: '2026-12-01' }), makeApplication({ deadline: '2026-11-21' })], NOW)).toBe('red')
  })
})

describe('reminderSignal', () => {
  it('is green with no open reminders', () => {
    expect(reminderSignal([], NOW)).toBe('green')
  })

  it('is amber when they are all still in the future', () => {
    expect(reminderSignal([makeReminder({ dueAt: new Date(2026, 10, 25, 9, 0).toISOString() })], NOW)).toBe('amber')
  })

  it('is red when any is overdue', () => {
    const late = makeReminder({ dueAt: new Date(2026, 10, 19, 9, 0).toISOString() })
    const fine = makeReminder({ dueAt: new Date(2026, 10, 25, 9, 0).toISOString() })
    expect(reminderSignal([fine, late], NOW)).toBe('red')
  })
})
