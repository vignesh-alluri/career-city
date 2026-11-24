import type { Application, ApplicationStatus } from '@/types'

export type StationId = 'saved' | 'applied' | 'assessment' | 'interview' | 'offer'

export interface Station { id: StationId; label: string; count: number }

const STATIONS: { id: StationId; label: string; statuses: ApplicationStatus[] }[] = [
  { id: 'saved', label: 'Saved', statuses: ['saved'] },
  { id: 'applied', label: 'Applied', statuses: ['applied'] },
  { id: 'assessment', label: 'Assessment', statuses: ['assessment'] },
  { id: 'interview', label: 'Interview', statuses: ['interview'] },
  { id: 'offer', label: 'Offer', statuses: ['offered', 'accepted'] },
]

/**
 * The pipeline drawn as a metro line. Each station counts the applications that are AT that stage right now
 * (we only store the current status, so this is a snapshot, not a history).
 * `litIndex` is the furthest station that has any application (-1 when there are none): the line glows up to there.
 * Rejected applications have left the line, so they are counted separately.
 */
export function pipelineStations(apps: Application[]): { stations: Station[]; litIndex: number; rejected: number } {
  const stations = STATIONS.map((s) => ({ id: s.id, label: s.label, count: apps.filter((a) => s.statuses.includes(a.status)).length }))
  let litIndex = -1
  stations.forEach((s, i) => { if (s.count > 0) litIndex = i })
  return { stations, litIndex, rejected: apps.filter((a) => a.status === 'rejected').length }
}

/** How far along an application is, 1 (saved) to 5 (offer). Rejected is 0: it has left the line. */
export const STAGE_LEVEL: Record<ApplicationStatus, number> = {
  saved: 1, applied: 2, assessment: 3, interview: 4, offered: 5, accepted: 5, rejected: 0,
}

export interface Building { id: string; company: string; role: string; status: ApplicationStatus; level: number }

/**
 * One building per application, for the dashboard skyline. Height is how far the application has got, so the skyline is real data.
 * Shown left to right from earliest to furthest stage, with rejected ones (level 0) last. If there are more than `max`,
 * the most advanced are kept and the rest are counted in `hidden`, so nothing is silently dropped.
 */
export function skylineBuildings(apps: Application[], max = 60): { buildings: Building[]; hidden: number } {
  const all: Building[] = apps.map((a) => ({ id: a.id, company: a.company, role: a.role, status: a.status, level: STAGE_LEVEL[a.status] }))
  const kept = [...all].sort((a, b) => (b.level || 0.5) - (a.level || 0.5)).slice(0, max)
  const order = (b: Building) => (b.level === 0 ? 99 : b.level)
  const createdAt = new Map(apps.map((a) => [a.id, a.createdAt]))
  kept.sort((a, b) => order(a) - order(b) || (createdAt.get(a.id) ?? '').localeCompare(createdAt.get(b.id) ?? ''))
  return { buildings: kept, hidden: all.length - kept.length }
}
