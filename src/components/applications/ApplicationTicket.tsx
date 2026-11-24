import type { CSSProperties } from 'react'
import { differenceInCalendarDays, parseISO } from 'date-fns'
import { Pencil, Trash2 } from 'lucide-react'
import { StatusBadge, STATUS_TEXT } from '@/components/ui/Badge'
import { Highlight } from '@/components/ui/Highlight'
import { formatDate } from '@/lib/format'
import { cn } from '@/lib/utils'
import { APPLICATION_STATUSES, type Application } from '@/types'

/** Where this status sits on the line, counting from 1. Rejected has left the line, so it gets a cross. */
const stationSymbol = (status: Application['status']) => (status === 'rejected' ? '\u00D7' : String(APPLICATION_STATUSES.indexOf(status) + 1))

/**
 * One application as a train ticket. The stub on the left carries the status as a station number (the same numbers as the
 * dashboard line), a dashed perforation separates it from the details, and a notch is cut out of the top and bottom edge at the tear.
 */
export function ApplicationTicket({ app, index, query = '', onOpen, onEdit, onDelete }: { app: Application; index: number; query?: string; onOpen: () => void; onEdit: () => void; onDelete: () => void }) {
  const days = app.deadline ? differenceInCalendarDays(parseISO(app.deadline), new Date()) : null
  const urgent = app.status === 'saved' && days !== null && days >= 0 && days <= 3
  return (
    <li className="ticket-wrap arrive" style={{ '--d': `${Math.min(index, 12) * 35}ms` } as CSSProperties} data-ripple="true">
      <div className="ticket grid grid-cols-[4.75rem_1fr_auto] border border-line bg-card">
        <div className="flex items-center justify-center bg-ember/[0.07]">
          <span
            aria-hidden title={app.status}
            className={cn('flex size-9 items-center justify-center rounded-full border-2 border-current font-mono text-sm font-bold', STATUS_TEXT[app.status])}
          >{stationSymbol(app.status)}</span>
        </div>
        <button type="button" onClick={onOpen} className="min-w-0 border-l-2 border-dashed border-ember/40 px-4 py-3 text-left">
          <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="truncate font-display text-base font-semibold"><Highlight text={app.company} query={query} /></span>
            <StatusBadge status={app.status} />
          </span>
          <span className="mt-0.5 block truncate text-sm text-muted"><Highlight text={app.role} query={query} />{app.location ? `, ${app.location}` : ''}</span>
          <span className="eyebrow mt-2 block truncate text-[10px] tracking-[0.14em]">
            {app.dateApplied ? `Applied ${formatDate(app.dateApplied)}` : 'Not applied'}
            <span aria-hidden className="mx-2 opacity-40">/</span>
            <span className={cn(urgent && 'text-amber')}>{app.deadline ? `Deadline ${formatDate(app.deadline)}` : 'No deadline'}</span>
          </span>
        </button>
        <div className="flex items-center gap-1 pr-3">
          <button type="button" aria-label={`Edit ${app.company}`} onClick={onEdit} className="rounded-control p-2 text-muted hover:bg-white/5 hover:text-ink"><Pencil size={16} /></button>
          <button type="button" aria-label={`Delete ${app.company}`} onClick={onDelete} className="rounded-control p-2 text-muted hover:bg-white/5 hover:text-danger"><Trash2 size={16} /></button>
        </div>
      </div>
    </li>
  )
}
