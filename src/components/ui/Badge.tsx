import type { HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'
import type { ApplicationStatus } from '@/types'

/** One colour per status, reused by the table, Kanban and calendar so meaning stays consistent. */
const statusStyles: Record<ApplicationStatus, string> = {
  saved: 'bg-muted/15 text-muted',
  applied: 'bg-cyan/15 text-cyan',
  assessment: 'bg-gold/15 text-gold',
  interview: 'bg-violet/25 text-violet',
  offered: 'bg-success/15 text-success',
  accepted: 'bg-success/25 text-success',
  rejected: 'bg-danger/15 text-danger',
}

/** Text colour per status (also used for the station symbol on a ticket). */
export const STATUS_TEXT: Record<ApplicationStatus, string> = {
  saved: 'text-muted', applied: 'text-cyan', assessment: 'text-gold', interview: 'text-violet', offered: 'text-success', accepted: 'text-success', rejected: 'text-danger',
}

export function StatusBadge({ status, className, ...props }: { status: ApplicationStatus } & HTMLAttributes<HTMLSpanElement>) {
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-[3px] border border-current/30 px-1.5 py-0.5 font-mono text-[10px] font-medium tracking-[0.14em] uppercase', statusStyles[status], className)} {...props}>
      <span aria-hidden className="size-1.5 rounded-full bg-current" />
      {status}
    </span>
  )
}
