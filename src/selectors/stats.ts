import { addDays, parseISO, startOfDay } from 'date-fns'
import type { Application, Reminder } from '@/types'

/** Saved applications whose deadline falls between today and `days` days from now. */
export function upcomingDeadlines(apps: Application[], now: Date, days = 14): Application[] {
  const start = startOfDay(now)
  const end = addDays(start, days)
  return apps
    .filter((a) => a.status === 'saved' && a.deadline && parseISO(a.deadline) >= start && parseISO(a.deadline) <= end)
    .sort((a, b) => a.deadline!.localeCompare(b.deadline!))
}

export const upcomingInterviews = (reminders: Reminder[], now: Date) =>
  reminders.filter((r) => r.type === 'interview' && !r.completed && parseISO(r.dueAt) >= now)

export interface DashboardStats {
  total: number; saved: number; active: number; interviewsScheduled: number
  offers: number; rejections: number; upcomingDeadlines: number
}

/**
 * Definitions (shown on the dashboard so they are never a mystery):
 *  total       = every application you have submitted (anything except "saved")
 *  active      = applied, assessment or interview
 *  offers      = offered or accepted
 *  interviews  = future, not-completed reminders of type "interview"
 */
export function computeStats(apps: Application[], reminders: Reminder[], now: Date): DashboardStats {
  const count = (...statuses: Application['status'][]) => apps.filter((a) => statuses.includes(a.status)).length
  return {
    total: apps.length - count('saved'),
    saved: count('saved'),
    active: count('applied', 'assessment', 'interview'),
    interviewsScheduled: upcomingInterviews(reminders, now).length,
    offers: count('offered', 'accepted'),
    rejections: count('rejected'),
    upcomingDeadlines: upcomingDeadlines(apps, now).length,
  }
}
