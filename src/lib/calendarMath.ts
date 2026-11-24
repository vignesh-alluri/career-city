import type { CalendarView } from './preferences'

/**
 * Date maths for the calendar, using the browser's own dates in the visitor's local time. Small and plain so it can be tested.
 * A "day key" is the text form of a day ("2026-11-25"): handy for grouping events and for knowing which day a cell stands for.
 */
export type WeekStart = 0 | 1
const pad = (n: number) => String(n).padStart(2, '0')

export const dayKey = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
export const parseDayKey = (key: string) => { const [y, m, d] = key.split('-').map(Number); return new Date(y, m - 1, d) }
export const startOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1)
/** Moves by whole days and drops the time of day (that is what calendar cells want). */
export const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n)
export const isSameDay = (a: Date, b: Date) => dayKey(a) === dayKey(b)
export const isSameMonth = (a: Date, b: Date) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth()

export function startOfWeek(d: Date, weekStartsOn: WeekStart): Date {
  return addDays(d, -((d.getDay() - weekStartsOn + 7) % 7))
}

/** Every day shown in a month view: whole weeks, so it starts before the 1st and ends after the last day when needed. */
export function monthGrid(anchor: Date, weekStartsOn: WeekStart): Date[] {
  const first = startOfMonth(anchor)
  const last = new Date(first.getFullYear(), first.getMonth() + 1, 0)
  const days: Date[] = []
  for (let d = startOfWeek(first, weekStartsOn); ; d = addDays(d, 1)) {
    days.push(d)
    if (d > last && days.length % 7 === 0) break
  }
  return days
}

export const weekDays = (anchor: Date, weekStartsOn: WeekStart): Date[] => {
  const start = startOfWeek(anchor, weekStartsOn)
  return Array.from({ length: 7 }, (_, i) => addDays(start, i))
}

/** The next `count` days from the anchor, for the agenda list. */
export const agendaDays = (anchor: Date, count = 28): Date[] => Array.from({ length: count }, (_, i) => addDays(anchor, i))

const NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
export const weekdayLabels = (weekStartsOn: WeekStart): string[] => Array.from({ length: 7 }, (_, i) => NAMES[(weekStartsOn + i) % 7])

export function groupByDay<T extends { date: Date }>(events: readonly T[]): Map<string, T[]> {
  const map = new Map<string, T[]>()
  for (const e of events) {
    const key = dayKey(e.date)
    const list = map.get(key)
    if (list) list.push(e); else map.set(key, [e])
  }
  return map
}

/** Applies the type filters (and the "show completed" switch) from the calendar's legend. */
export function filterEvents<T extends { kind: string; completed: boolean }>(events: readonly T[], visibleKinds: ReadonlySet<string>, showCompleted: boolean): T[] {
  return events.filter((e) => visibleKinds.has(e.kind) && (showCompleted || !e.completed))
}

/** Moves a date-and-time to another day and keeps the time of day: a 9:30 interview dragged to the 25th is still at 9:30. */
export function moveToDay(isoDateTime: string, targetKey: string): string {
  const time = new Date(isoDateTime)
  const [y, m, d] = targetKey.split('-').map(Number)
  return new Date(y, m - 1, d, time.getHours(), time.getMinutes(), time.getSeconds(), time.getMilliseconds()).toISOString()
}

/** One step forward (1) or back (-1): a month, a week, or two weeks of agenda. */
export function shiftAnchor(view: CalendarView, anchor: Date, direction: -1 | 1): Date {
  if (view === 'month') return new Date(anchor.getFullYear(), anchor.getMonth() + direction, 1)
  return addDays(anchor, (view === 'week' ? 7 : 14) * direction)
}
