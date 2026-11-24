import type { Application, DistrictId, Reminder } from '@/types'

/**
 * Phase 7: the numbers that will drive the 3D city. This is a pure function (data in, numbers out), so it can be
 * tested without a browser, a database or Three.js. The 3D components never see applications, only these counts.
 *
 * Each district grows with the stage of the journey it stands for:
 *   discovery   = saved roles
 *   application = applied + assessment
 *   interview   = interview stage
 *   achievement = offered + accepted
 *   analytics   = every application (overall activity)
 * Rejections belong to no district; they are counted separately so the city can show them (for example as unlit towers).
 */
export interface CityMetrics {
  counts: Record<DistrictId, number>
  rejected: number
  total: number
  upcomingInterviews: number
}

export function computeCityMetrics(apps: readonly Application[], reminders: readonly Reminder[], now: Date): CityMetrics {
  const n = (...statuses: Application['status'][]) => apps.filter((a) => statuses.includes(a.status)).length
  const nowMs = now.getTime()
  return {
    counts: {
      discovery: n('saved'),
      application: n('applied', 'assessment'),
      interview: n('interview'),
      achievement: n('offered', 'accepted'),
      analytics: apps.length,
    },
    rejected: n('rejected'),
    total: apps.length,
    upcomingInterviews: reminders.filter((r) => r.type === 'interview' && !r.completed && new Date(r.dueAt).getTime() >= nowMs).length,
  }
}
