import { differenceInCalendarDays, format, parseISO } from 'date-fns'

export const formatDate = (iso: string | null) => (iso ? format(parseISO(iso), 'd MMM yyyy') : '-')
export const formatDateTime = (iso: string) => format(parseISO(iso), 'd MMM yyyy, HH:mm')
export const toDateKey = (d: Date) => format(d, 'yyyy-MM-dd')

/** Only allow http(s) links to be rendered as anchors (stored data is never blindly trusted). */
export function safeHref(value: string | null): string | null {
  if (!value) return null
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.href : null
  } catch { return null }
}

/** How long ago a date was, in plain words: "today", "5 days ago", "3 weeks ago", "2 months ago". */
export function ageLabel(dateIso: string, now: Date): string {
  const days = differenceInCalendarDays(now, parseISO(dateIso))
  if (days <= 0) return 'today'
  if (days === 1) return 'yesterday'
  if (days < 14) return `${days} days ago`
  if (days < 60) return `${Math.floor(days / 7)} weeks ago`
  return `${Math.floor(days / 30)} months ago`
}
