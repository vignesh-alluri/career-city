import { differenceInCalendarDays, parseISO } from 'date-fns'
import type { Application, Reminder } from '@/types'

/** Like a railway signal: green = clear, amber = something is coming, red = act now. */
export type Signal = 'green' | 'amber' | 'red'

/** A deadline closer than this many days turns the signal red. */
export const URGENT_DAYS = 2

/**
 * Signal for the deadlines board (it is given the saved roles with a deadline in the next 14 days).
 * red: one is due today, tomorrow or the day after   amber: there are some   green: none
 */
export function deadlineSignal(deadlines: Application[], now: Date): Signal {
  if (deadlines.length === 0) return 'green'
  const urgent = deadlines.some((a) => a.deadline && differenceInCalendarDays(parseISO(a.deadline), now) <= URGENT_DAYS)
  return urgent ? 'red' : 'amber'
}

/** Signal for open reminders. red: at least one is overdue   amber: there are open ones   green: none */
export function reminderSignal(open: Reminder[], now: Date): Signal {
  if (open.length === 0) return 'green'
  return open.some((r) => parseISO(r.dueAt) < now) ? 'red' : 'amber'
}
