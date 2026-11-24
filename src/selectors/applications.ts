import type { Application, ApplicationStatus } from '@/types'

export type SortKey = 'applied-desc' | 'applied-asc' | 'deadline-asc' | 'deadline-desc'
export const SORT_LABELS: Record<SortKey, string> = {
  'applied-desc': 'Date applied: newest first',
  'applied-asc': 'Date applied: oldest first',
  'deadline-asc': 'Deadline: soonest first',
  'deadline-desc': 'Deadline: latest first',
}

export interface Filters { search: string; status: ApplicationStatus | 'all'; sort: SortKey }
export const DEFAULT_FILTERS: Filters = { search: '', status: 'all', sort: 'applied-desc' }

/** ISO dates ("2026-03-14") sort correctly as plain strings. Missing dates always go last. */
function compareDates(a: string | null, b: string | null, dir: 1 | -1): number {
  if (a === b) return 0
  if (!a) return 1
  if (!b) return -1
  return a < b ? -dir : dir
}

export function filterApplications(apps: Application[], f: Filters): Application[] {
  const q = f.search.trim().toLowerCase()
  const matches = apps.filter((a) =>
    (f.status === 'all' || a.status === f.status) &&
    (!q || a.company.toLowerCase().includes(q) || a.role.toLowerCase().includes(q)))
  const field = f.sort.startsWith('applied') ? 'dateApplied' : 'deadline'
  const dir = f.sort.endsWith('asc') ? 1 : -1
  return [...matches].sort((a, b) => compareDates(a[field], b[field], dir))
}
