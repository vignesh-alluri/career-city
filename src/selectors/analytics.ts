import { addWeeks, format, parseISO, startOfWeek, subWeeks } from 'date-fns'
import { APPLICATION_STATUSES, STATUS_LABELS, type Application, type ApplicationStatus, type Reminder } from '@/types'

export const statusDistribution = (apps: Application[]) =>
  APPLICATION_STATUSES.map((status) => ({ status, label: STATUS_LABELS[status], count: apps.filter((a) => a.status === status).length }))

export interface Conversion {
  submitted: number; interviewed: number; offered: number
  interviewRate: number | null; offerRate: number | null
}

const INTERVIEW_REACHED: ApplicationStatus[] = ['interview', 'offered', 'accepted']

/**
 * Conversion is measured against applications you actually submitted (not "saved" ones).
 * An application counts as "reached interview" if it is now at/after the interview stage OR has an interview reminder.
 * Limitation: we only store the CURRENT status, so someone rejected after an interview is only counted
 * if you also logged an interview reminder for them.
 */
export function conversionRates(apps: Application[], reminders: Reminder[]): Conversion {
  const submitted = apps.filter((a) => a.status !== 'saved')
  const withInterviewReminder = new Set(reminders.filter((r) => r.type === 'interview' && r.applicationId).map((r) => r.applicationId))
  const interviewed = submitted.filter((a) => INTERVIEW_REACHED.includes(a.status) || withInterviewReminder.has(a.id)).length
  const offered = submitted.filter((a) => a.status === 'offered' || a.status === 'accepted').length
  return {
    submitted: submitted.length, interviewed, offered,
    interviewRate: submitted.length ? interviewed / submitted.length : null,
    offerRate: submitted.length ? offered / submitted.length : null,
  }
}

function weekStarts(now: Date, weeks: number): Date[] {
  return Array.from({ length: weeks }, (_, i) => startOfWeek(subWeeks(now, weeks - 1 - i), { weekStartsOn: 1 }))
}
const appliedDate = (a: Application) => (a.dateApplied ? parseISO(a.dateApplied) : null)

/** Applications submitted in each of the last `weeks` weeks (weeks start on Monday). */
export function weeklyActivity(apps: Application[], now: Date, weeks = 8) {
  return weekStarts(now, weeks).map((start) => {
    const end = addWeeks(start, 1)
    const count = apps.filter((a) => { const d = appliedDate(a); return d && d >= start && d < end }).length
    return { week: format(start, 'd MMM'), count }
  })
}

/** Running total of submitted applications at the end of each of the last `weeks` weeks. */
export function applicationsOverTime(apps: Application[], now: Date, weeks = 12) {
  const starts = weekStarts(now, weeks)
  let running = apps.filter((a) => { const d = appliedDate(a); return d && d < starts[0] }).length
  return starts.map((start) => {
    const end = addWeeks(start, 1)
    running += apps.filter((a) => { const d = appliedDate(a); return d && d >= start && d < end }).length
    return { week: format(start, 'd MMM'), total: running }
  })
}

/** Totals for the weekly-activity chart: how many in the window, the weekly average, and the busiest week (the first one if tied). */
export function activitySummary(weeks: { week: string; count: number }[]): { total: number; average: number; busiest: { week: string; count: number } | null } {
  const total = weeks.reduce((n, w) => n + w.count, 0)
  let busiest: { week: string; count: number } | null = null
  for (const w of weeks) if (w.count > 0 && (!busiest || w.count > busiest.count)) busiest = w
  return { total, average: weeks.length ? Math.round((total / weeks.length) * 10) / 10 : 0, busiest }
}
