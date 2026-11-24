import { useEffect, useMemo, useState } from 'react'
import {
  DndContext, DragOverlay, KeyboardSensor, PointerSensor, TouchSensor, pointerWithin, rectIntersection,
  useDraggable, useDroppable, useSensor, useSensors, type CollisionDetection, type DragEndEvent,
} from '@dnd-kit/core'
import { endOfDay, endOfMonth, format, startOfDay, startOfMonth } from 'date-fns'
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { PageHeader } from '@/components/ui/PageHeader'
import { DataGate } from '@/components/ui/DataGate'
import { useApplications, useReminders, useUpdateApplication, useUpdateReminder } from '@/hooks/useTracker'
import {
  agendaDays, dayKey, filterEvents, groupByDay, isSameDay, isSameMonth, monthGrid, moveToDay, parseDayKey, shiftAnchor,
  weekDays, weekdayLabels,
} from '@/lib/calendarMath'
import { CALENDAR_VIEWS, type CalendarView } from '@/lib/preferences'
import { cn } from '@/lib/utils'
import { buildEvents, type CalendarEvent, rangeSummary } from '@/selectors/calendar'
import { useModalStore } from '@/store/modalStore'
import { usePreferences } from '@/store/preferencesStore'
import { REMINDER_LABELS, REMINDER_TYPES, type Application, type Reminder, type ReminderType } from '@/types'

const KIND_STYLE: Record<ReminderType, string> = {
  interview: 'bg-violet/25 text-violet',
  follow_up: 'bg-accent/20 text-accent',
  deadline: 'bg-amber/20 text-amber',
  custom: 'bg-white/10 text-muted',
}
const VIEW_LABELS: Record<CalendarView, string> = { month: 'Month', week: 'Week', agenda: 'Agenda' }

/** The pointer decides the day; if the pointer is outside every day (keyboard dragging), fall back to overlap. */
const collision: CollisionDetection = (args) => {
  const hits = pointerWithin(args)
  return hits.length ? hits : rectIntersection(args)
}

function EventRow({ event }: { event: CalendarEvent }) {
  const open = useModalStore((s) => s.open)
  const update = useUpdateReminder()
  return (
    <li className="flex items-center gap-3 rounded-control px-2 py-2 hover:bg-white/5">
      {event.reminderId ? (
        <input
          type="checkbox" checked={event.completed} aria-label={`Mark "${event.title}" as done`} className="size-4 accent-[var(--color-accent)]"
          onChange={(e) => update.mutate({ id: event.reminderId!, patch: { completed: e.target.checked } })}
        />
      ) : <span className="size-4" aria-hidden />}
      <span className="min-w-0 flex-1">
        <span className={cn('block truncate text-sm', event.completed && 'text-muted line-through')}>{event.title}</span>
        <span className="block text-xs text-muted">{REMINDER_LABELS[event.kind]}{event.hasTime ? `, ${format(event.date, 'HH:mm')}` : ''}</span>
      </span>
      {event.applicationId && <Button variant="ghost" onClick={() => open({ kind: 'details', id: event.applicationId! })}>Open</Button>}
    </li>
  )
}

/** One event as a small coloured tag. Drag it onto another day to reschedule it. */
function EventChip({ event, showTime }: { event: CalendarEvent; showTime: boolean }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: event.id })
  return (
    <button
      ref={setNodeRef} type="button" {...attributes} {...listeners}
      title={`${event.title}. Drag it onto another day to reschedule.`}
      className={cn('block w-full cursor-grab truncate rounded-sm px-1.5 py-0.5 text-left text-[11px] active:cursor-grabbing', KIND_STYLE[event.kind], event.completed && 'line-through opacity-55', isDragging && 'opacity-30')}
    >
      {showTime && event.hasTime && <span className="mr-1 opacity-70">{format(event.date, 'HH:mm')}</span>}{event.title}
    </button>
  )
}

interface DayCellProps {
  day: Date; label: string; events: CalendarEvent[]; faded: boolean; selected: boolean; today: boolean; tall: boolean
  onSelect: () => void; onAdd: () => void
}

/** One day: a drop target for dragged events, with its own quick "add reminder" button. */
function DayCell({ day, label, events, faded, selected, today, tall, onSelect, onAdd }: DayCellProps) {
  const { setNodeRef, isOver } = useDroppable({ id: `day:${dayKey(day)}` })
  const shown = tall ? events : events.slice(0, 3)
  const extra = events.length - shown.length
  return (
    <div
      ref={setNodeRef} onClick={onSelect} onDoubleClick={onAdd}
      className={cn(
        'group flex flex-col gap-1 rounded-control border p-1.5 transition-colors',
        tall ? 'min-h-40' : 'min-h-20 sm:min-h-28',
        selected ? 'border-accent bg-accent/10' : 'border-line hover:bg-white/5',
        isOver && 'border-accent bg-accent/25',
        faded && 'opacity-45',
      )}
    >
      <div className="flex items-center justify-between gap-1">
        <button
          type="button" aria-pressed={selected} onClick={(e) => { e.stopPropagation(); onSelect() }}
          aria-label={`${format(day, 'EEEE d MMMM')}, ${events.length} ${events.length === 1 ? 'event' : 'events'}`}
          className={cn('rounded-full px-1.5 text-xs', today ? 'bg-accent font-semibold text-void' : 'text-muted')}
        >{label}</button>
        <button
          type="button" onClick={(e) => { e.stopPropagation(); onAdd() }} aria-label={`Add a reminder on ${format(day, 'd MMMM')}`}
          className="rounded p-0.5 text-muted hover:text-ink focus-visible:opacity-100 sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100"
        ><Plus size={14} /></button>
      </div>
      <div className="flex flex-col gap-0.5">{shown.map((e) => <EventChip key={e.id} event={e} showTime={tall} />)}</div>
      {extra > 0 && <button type="button" onClick={(e) => { e.stopPropagation(); onSelect() }} className="text-left text-[11px] text-muted hover:text-ink">+{extra} more</button>}
    </div>
  )
}

const isTypingTarget = (el: EventTarget | null) => {
  const t = el as HTMLElement | null
  return !!t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable)
}

function CalendarContent({ apps, reminders }: { apps: Application[]; reminders: Reminder[] }) {
  const open = useModalStore((s) => s.open)
  const view = usePreferences((s) => s.calendarView)
  const weekStartsOn = usePreferences((s) => s.weekStartsOn)
  const update = usePreferences((s) => s.update)
  const updateReminder = useUpdateReminder()
  const updateApplication = useUpdateApplication()

  const [anchor, setAnchor] = useState(() => new Date())
  const [selected, setSelected] = useState(() => new Date())
  const [visible, setVisible] = useState<Set<ReminderType>>(() => new Set(REMINDER_TYPES))
  const [showCompleted, setShowCompleted] = useState(true)
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }), // a plain click passes through without starting a drag
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 6 } }),
    useSensor(KeyboardSensor),
  )

  const allEvents = useMemo(() => buildEvents(apps, reminders), [apps, reminders])
  const events = useMemo(() => filterEvents(allEvents, visible, showCompleted), [allEvents, visible, showCompleted])
  const byDay = useMemo(() => groupByDay(events), [events])
  const today = new Date()

  const setView = (v: CalendarView) => update({ calendarView: v }) // remembered for next time
  const goToday = () => { setAnchor(new Date()); setSelected(new Date()) }
  const toggleKind = (k: ReminderType) => setVisible((prev) => { const next = new Set(prev); if (next.has(k)) next.delete(k); else next.add(k); return next })

  // keyboard: arrows move through time, T jumps to today, 1/2/3 switch view
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey || e.defaultPrevented || draggingId || isTypingTarget(e.target) || document.querySelector('dialog[open]')) return
      if (e.key === 'ArrowLeft') { e.preventDefault(); setAnchor((a) => shiftAnchor(view, a, -1)) }
      else if (e.key === 'ArrowRight') { e.preventDefault(); setAnchor((a) => shiftAnchor(view, a, 1)) }
      else if (e.key.toLowerCase() === 't') goToday()
      else if (e.key === '1' || e.key === '2' || e.key === '3') update({ calendarView: CALENDAR_VIEWS[Number(e.key) - 1] })
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [view, draggingId, update])

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    setDraggingId(null)
    if (!over || !String(over.id).startsWith('day:')) return
    const key = String(over.id).slice(4)
    const event = events.find((e) => e.id === active.id)
    if (!event || dayKey(event.date) === key) return
    setMessage(null)
    const done = () => setMessage(`Moved "${event.title}" to ${format(parseDayKey(key), 'EEE d MMM')}.`)
    const failed = (err: unknown) => setMessage(`Could not move that: ${err instanceof Error ? err.message : 'unknown error'}`)
    if (event.reminderId) {
      updateReminder.mutate({ id: event.reminderId, patch: { dueAt: moveToDay(event.date.toISOString(), key) } }, { onSuccess: done, onError: failed })
    } else if (event.applicationId) {
      updateApplication.mutate({ id: event.applicationId, patch: { deadline: key } }, { onSuccess: done, onError: failed }) // a deadline belongs to its application
    }
  }

  const days = view === 'month' ? monthGrid(anchor, weekStartsOn) : weekDays(anchor, weekStartsOn)
  const title = view === 'month' ? format(anchor, 'MMMM yyyy') : view === 'week' ? `${format(days[0], 'd MMM')} - ${format(days[6], 'd MMM yyyy')}` : `From ${format(anchor, 'd MMM yyyy')}`
  const selectedEvents = byDay.get(dayKey(selected)) ?? []
  // a one-line summary of what is on screen: the whole month, or the seven days shown
  const summary = view === 'agenda' ? null : rangeSummary(events, view === 'month' ? startOfMonth(anchor) : startOfDay(days[0]), view === 'month' ? endOfMonth(anchor) : endOfDay(days[6]))
  const upcoming = allEvents.filter((e) => !e.completed && e.date >= new Date(today.getFullYear(), today.getMonth(), today.getDate())).slice(0, 6)
  const dragged = events.find((e) => e.id === draggingId)
  const agenda = view === 'agenda' ? agendaDays(anchor, 28).map((day) => ({ day, list: byDay.get(dayKey(day)) ?? [] })).filter((x) => x.list.length > 0) : []

  return (
    <DndContext
      sensors={sensors} collisionDetection={collision}
      onDragStart={(e) => { setDraggingId(String(e.active.id)); setMessage(null) }} onDragEnd={onDragEnd} onDragCancel={() => setDraggingId(null)}
    >
      <div className="grid gap-6 xl:grid-cols-[1fr_22rem]">
        <Card className="flex flex-col gap-4 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold" aria-live="polite">{title}</h2>
              {summary && (
                <p className="eyebrow mt-1 text-[10px] tracking-[0.14em]">
                  {summary.total === 0 ? 'Nothing scheduled' : `${summary.total} ${summary.total === 1 ? 'event' : 'events'}`}
                  {summary.deadlines > 0 && ` / ${summary.deadlines} ${summary.deadlines === 1 ? 'deadline' : 'deadlines'}`}
                  {summary.interviews > 0 && ` / ${summary.interviews} ${summary.interviews === 1 ? 'interview' : 'interviews'}`}
                  {summary.done > 0 && ` / ${summary.done} done`}
                </p>
              )}
            </div>
            <div className="flex items-center gap-1" role="toolbar" aria-label="Calendar navigation">
              <Button variant="ghost" aria-label="Previous" className="px-2" onClick={() => setAnchor(shiftAnchor(view, anchor, -1))}><ChevronLeft size={18} /></Button>
              <Button variant="secondary" onClick={goToday}>Today</Button>
              <Button variant="ghost" aria-label="Next" className="px-2" onClick={() => setAnchor(shiftAnchor(view, anchor, 1))}><ChevronRight size={18} /></Button>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div role="group" aria-label="View" className="inline-flex rounded-control border border-line p-0.5">
              {CALENDAR_VIEWS.map((v, i) => (
                <button
                  key={v} type="button" aria-pressed={view === v} onClick={() => setView(v)} title={`Press ${i + 1}`}
                  className={cn('rounded-[calc(var(--radius-control)-2px)] px-3 py-1 text-sm transition-colors', view === v ? 'bg-accent text-void' : 'text-muted hover:text-ink')}
                >{VIEW_LABELS[v]}</button>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Show event types">
              {REMINDER_TYPES.map((k) => (
                <button
                  key={k} type="button" aria-pressed={visible.has(k)} onClick={() => toggleKind(k)}
                  className={cn('rounded-full px-2.5 py-1 text-xs transition-opacity', KIND_STYLE[k], !visible.has(k) && 'line-through opacity-40')}
                >{REMINDER_LABELS[k]}</button>
              ))}
              <label className="flex cursor-pointer items-center gap-1.5 text-xs text-muted">
                <input type="checkbox" checked={showCompleted} onChange={(e) => setShowCompleted(e.target.checked)} className="accent-[var(--color-accent)]" /> Completed
              </label>
            </div>
          </div>

          {view === 'agenda' ? (
            agenda.length === 0 ? <p className="py-8 text-center text-sm text-muted">Nothing in the next four weeks. Double-click a day in the month view, or use Add reminder.</p> : (
              <ul className="flex flex-col gap-4">
                {agenda.map(({ day, list }) => (
                  <li key={dayKey(day)}>
                    <h3 className={cn('text-sm font-medium', isSameDay(day, today) && 'text-accent')}>{isSameDay(day, today) ? 'Today, ' : ''}{format(day, 'EEEE d MMMM')}</h3>
                    <ul className="mt-1">{list.map((e) => <EventRow key={e.id} event={e} />)}</ul>
                  </li>
                ))}
              </ul>
            )
          ) : (
            <div>
              {view === 'month' && (
                <div className="grid grid-cols-7 gap-px text-center text-xs text-muted">
                  {weekdayLabels(weekStartsOn).map((d) => <div key={d} className="pb-2">{d}</div>)}
                </div>
              )}
              <div className={cn('grid gap-1', view === 'month' ? 'grid-cols-7' : 'grid-cols-1 md:grid-cols-7')}>
                {days.map((day) => (
                  <DayCell
                    key={dayKey(day)} day={day} label={view === 'week' ? format(day, 'EEE d') : format(day, 'd')}
                    events={byDay.get(dayKey(day)) ?? []} tall={view === 'week'}
                    faded={view === 'month' && !isSameMonth(day, anchor)} selected={isSameDay(day, selected)} today={isSameDay(day, today)}
                    onSelect={() => setSelected(day)} onAdd={() => open({ kind: 'reminder', defaultDate: dayKey(day) })}
                  />
                ))}
              </div>
            </div>
          )}

          <p className="text-xs text-muted" role="status">
            {message ?? 'Drag an event onto another day to reschedule it. Double-click a day to add a reminder. Arrow keys move, T is today, 1 2 3 switch view.'}
          </p>
        </Card>

        <div className="flex flex-col gap-6">
          <Card>
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-lg font-semibold">{format(selected, 'EEE d MMM')}</h2>
              <Button variant="secondary" onClick={() => open({ kind: 'reminder', defaultDate: dayKey(selected) })}><Plus size={16} /> Reminder</Button>
            </div>
            {selectedEvents.length === 0 ? <p className="mt-3 text-sm text-muted">Nothing on this day.</p> : <ul className="mt-3 flex flex-col">{selectedEvents.map((e) => <EventRow key={e.id} event={e} />)}</ul>}
          </Card>
          <Card>
            <h2 className="text-lg font-semibold">Coming up</h2>
            {upcoming.length === 0 ? <p className="mt-3 text-sm text-muted">No upcoming events.</p> : (
              <ul className="mt-3 flex flex-col gap-1">
                {upcoming.map((e) => (
                  <li key={e.id} className="flex items-center justify-between gap-3 px-2 py-1.5 text-sm">
                    <span className="truncate">{e.title}</span><span className="shrink-0 text-xs text-muted">{format(e.date, 'd MMM')}</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
      <DragOverlay>
        {dragged ? <div className={cn('rounded-sm px-2 py-1 text-xs shadow-[0_18px_30px_-10px_rgb(0_0_0/0.8)]', KIND_STYLE[dragged.kind])}>{dragged.title}</div> : null}
      </DragOverlay>
    </DndContext>
  )
}

export default function CalendarPage() {
  const apps = useApplications()
  const reminders = useReminders()
  return (
    <div className="flex flex-col gap-6">
      <PageHeader id="calendar" title="Calendar" description="Interviews, follow-ups and deadlines on one timetable." />
      <DataGate queries={[apps, reminders]}>{() => <CalendarContent apps={apps.data!} reminders={reminders.data!} />}</DataGate>
    </div>
  )
}
