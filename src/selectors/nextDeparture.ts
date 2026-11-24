import { differenceInCalendarDays, parseISO, startOfDay } from 'date-fns'
import { REMINDER_LABELS, type Application, type Reminder } from '@/types'

export interface Departure {
  kind: 'deadline' | 'reminder'
  at: Date
  /** Reminders have a time; deadlines are for the whole day */
  hasTime: boolean
  title: string
  detail: string
  applicationId: string | null
}

/**
 * The single next thing on your timetable: the soonest open reminder from now on, or the soonest deadline of a saved role from today on.
 * Completed reminders, reminders already in the past (the red signal covers those) and deadlines of roles you have moved on from are left out.
 */
export function nextDeparture(apps: Application[], reminders: Reminder[], now: Date): Departure | null {
  const byId = new Map(apps.map((a) => [a.id, a]))
  const found: Departure[] = []
  for (const r of reminders) {
    if (r.completed) continue
    const at = parseISO(r.dueAt)
    if (at < now) continue
    const linked = r.applicationId ? byId.get(r.applicationId) : undefined
    found.push({ kind: 'reminder', at, hasTime: true, title: r.title, detail: `${REMINDER_LABELS[r.type]}${linked ? `, ${linked.company}` : ''}`, applicationId: linked?.id ?? null })
  }
  const today = startOfDay(now)
  for (const a of apps) {
    if (a.status !== 'saved' || !a.deadline) continue
    const at = parseISO(a.deadline)
    if (at < today) continue
    found.push({ kind: 'deadline', at, hasTime: false, title: a.company, detail: `Deadline, ${a.role}`, applicationId: a.id })
  }
  found.sort((x, y) => x.at.getTime() - y.at.getTime())
  return found[0] ?? null
}

/** "today", "tomorrow" or "in 5 days", counted in calendar days. */
export function dayLabel(at: Date, now: Date): string {
  const days = differenceInCalendarDays(at, now)
  if (days <= 0) return 'today'
  if (days === 1) return 'tomorrow'
  return `in ${days} days`
}
