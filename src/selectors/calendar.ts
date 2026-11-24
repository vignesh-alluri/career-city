import { parseISO } from 'date-fns'
import type { Application, Reminder, ReminderType } from '@/types'

export interface CalendarEvent {
  id: string
  date: Date
  kind: ReminderType
  title: string
  applicationId: string | null
  reminderId: string | null
  completed: boolean
  hasTime: boolean
}

/** Merges application deadlines and reminders (interviews, follow-ups, custom) into one sorted list of calendar events. */
export function buildEvents(apps: Application[], reminders: Reminder[]): CalendarEvent[] {
  const deadlines: CalendarEvent[] = apps
    .filter((a) => a.deadline)
    .map((a) => ({
      id: `deadline-${a.id}`, date: parseISO(a.deadline!), kind: 'deadline' as const,
      title: `Deadline: ${a.company}, ${a.role}`, applicationId: a.id, reminderId: null,
      completed: a.status !== 'saved', // once you've applied, the deadline no longer needs action
      hasTime: false,
    }))
  const fromReminders: CalendarEvent[] = reminders.map((r) => ({
    id: r.id, date: parseISO(r.dueAt), kind: r.type, title: r.title,
    applicationId: r.applicationId, reminderId: r.id, completed: r.completed, hasTime: true,
  }))
  return [...deadlines, ...fromReminders].sort((a, b) => a.date.getTime() - b.date.getTime())
}

/** Counts the events whose date falls from `from` to `to` (both included): used for the one-line summary under the calendar title. */
export function rangeSummary(events: CalendarEvent[], from: Date, to: Date): { total: number; deadlines: number; interviews: number; done: number } {
  const inRange = events.filter((e) => e.date >= from && e.date <= to)
  return {
    total: inRange.length,
    deadlines: inRange.filter((e) => e.kind === 'deadline').length,
    interviews: inRange.filter((e) => e.kind === 'interview').length,
    done: inRange.filter((e) => e.completed).length,
  }
}
