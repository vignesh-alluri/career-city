import { useMemo, useState } from 'react'
import {
  DndContext, DragOverlay, KeyboardSensor, PointerSensor, TouchSensor, pointerWithin, rectIntersection,
  useDraggable, useDroppable, useSensor, useSensors, type CollisionDetection, type DragEndEvent,
} from '@dnd-kit/core'
import { Maximize2, Plus } from 'lucide-react'
import { StatusBadge, STATUS_TEXT } from '@/components/ui/Badge'
import { PageHeader } from '@/components/ui/PageHeader'
import { DataGate } from '@/components/ui/DataGate'
import { useApplications, useMoveApplication } from '@/hooks/useTracker'
import { ageLabel, formatDate } from '@/lib/format'
import { useModalStore } from '@/store/modalStore'
import { usePreferences } from '@/store/preferencesStore'
import { APPLICATION_STATUSES, STATUS_LABELS, type Application, type ApplicationStatus } from '@/types'
import { cn } from '@/lib/utils'

/** Pointer position decides the column; if the pointer is outside every column (keyboard dragging), fall back to overlap. */
const collision: CollisionDetection = (args) => {
  const hits = pointerWithin(args)
  return hits.length ? hits : rectIntersection(args)
}

function CardBody({ app }: { app: Application }) {
  return (
    <>
      <p className="truncate text-sm font-medium">{app.company}</p>
      <p className="truncate text-xs text-muted">{app.role}</p>
      {(app.deadline || app.location) && (
        <p className="mt-2 truncate text-xs text-muted">{app.deadline ? `Deadline ${formatDate(app.deadline)}` : app.location}</p>
      )}
      {app.dateApplied && app.status !== 'saved' && <p className="eyebrow mt-1.5 text-[10px] tracking-[0.12em] normal-case">Applied {ageLabel(app.dateApplied, new Date())}</p>}
    </>
  )
}

function BoardCard({ app }: { app: Application }) {
  const open = useModalStore((s) => s.open)
  // useDraggable makes this element pick-up-able. `listeners` and `attributes` add pointer, touch and keyboard handling.
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: app.id })
  return (
    <div
      ref={setNodeRef} {...attributes} {...listeners} data-ripple="true"
      className={cn('arrive relative cursor-grab overflow-hidden rounded-control border border-line bg-card p-3 pr-9 shadow-card transition duration-150 hover:-translate-y-0.5 hover:border-accent/40 hover:shadow-card-hover active:cursor-grabbing', isDragging && 'opacity-40')}
    >
      <CardBody app={app} />
      <button
        type="button" aria-label={`Open ${app.company}`} onClick={() => open({ kind: 'details', id: app.id })}
        className="absolute top-2 right-2 rounded-control p-1 text-muted hover:bg-white/5 hover:text-ink"
      ><Maximize2 size={14} /></button>
    </div>
  )
}

function Column({ status, apps, number }: { status: ApplicationStatus; apps: Application[]; number: number }) {
  const open = useModalStore((s) => s.open)
  const { setNodeRef, isOver } = useDroppable({ id: status }) // a droppable area: dropping a card here calls onDragEnd with this id
  return (
    <section aria-label={`${STATUS_LABELS[status]} column`} className="flex min-w-44 flex-1 basis-0 flex-col rounded-panel border border-line bg-surface shadow-card">
      <header className="flex items-center justify-between px-3 py-3">
        <h2 className="flex items-center gap-2.5 text-sm">
          {/* each column is a platform: a number sign in the status colour, then the status and how many are waiting */}
          <span aria-hidden className={cn('flex size-6 items-center justify-center rounded-[4px] border-2 border-current font-mono text-xs font-bold', STATUS_TEXT[status])}>{number}</span>
          <StatusBadge status={status} /><span className="font-mono text-xs text-muted">{apps.length}</span>
        </h2>
        <button type="button" aria-label={`Add to ${STATUS_LABELS[status]}`} onClick={() => open({ kind: 'create', defaultStatus: status })} className="rounded-control p-1 text-muted hover:bg-white/5 hover:text-ink"><Plus size={16} /></button>
      </header>
      <div ref={setNodeRef} className={cn('flex min-h-[22rem] flex-1 flex-col gap-2 rounded-b-panel p-2 transition-colors', isOver && 'bg-accent/10')}>
        {apps.map((a) => <BoardCard key={a.id} app={a} />)}
        {apps.length === 0 && <p className="eyebrow m-auto px-2 text-center text-[10px] opacity-60">{isOver ? 'Release to board' : 'No tickets on this platform'}</p>}
      </div>
    </section>
  )
}

function BoardContent({ apps }: { apps: Application[] }) {
  const move = useMoveApplication()
  const [activeId, setActiveId] = useState<string | null>(null)
  const hidden = usePreferences((s) => s.boardHidden)
  const updatePreferences = usePreferences((s) => s.update)
  // Distance/delay thresholds let a plain click (or a scroll) pass through without starting a drag.
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 6 } }),
    useSensor(KeyboardSensor),
  )

  const columns = useMemo(() => {
    const map = new Map<ApplicationStatus, Application[]>(APPLICATION_STATUSES.map((s) => [s, []]))
    for (const a of apps) map.get(a.status)?.push(a)
    for (const list of map.values()) list.sort((a, b) => a.boardPosition - b.boardPosition)
    return map
  }, [apps])

  const activeApp = apps.find((a) => a.id === activeId)

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    setActiveId(null)
    if (!over) return
    const status = over.id as ApplicationStatus
    const app = apps.find((a) => a.id === active.id)
    if (app && APPLICATION_STATUSES.includes(status) && app.status !== status) move.mutate({ id: app.id, status })
  }

  return (
    <div className="flex flex-col gap-3">
      <div role="group" aria-label="Visible columns" className="flex flex-wrap items-center gap-2 text-xs">
        <span className="eyebrow">Platforms</span>
        {APPLICATION_STATUSES.map((s) => (
          <button
            key={s} type="button" aria-pressed={!hidden.includes(s)}
            onClick={() => updatePreferences({ boardHidden: hidden.includes(s) ? hidden.filter((x) => x !== s) : [...hidden, s] })}
            className={cn('rounded-[3px] border px-2 py-1 font-mono tracking-wider uppercase transition-colors', hidden.includes(s) ? 'border-line text-muted line-through' : 'border-accent/50 text-ink')}
          >{STATUS_LABELS[s]} <span className="opacity-60">{columns.get(s)?.length ?? 0}</span></button>
        ))}
      </div>
      {move.isError && <p role="alert" className="text-sm text-danger">Could not move that card: {move.error instanceof Error ? move.error.message : 'unknown error'}. It was put back.</p>}
      <DndContext sensors={sensors} collisionDetection={collision} onDragStart={(e) => setActiveId(String(e.active.id))} onDragEnd={onDragEnd} onDragCancel={() => setActiveId(null)}>
        <div className="flex gap-3 overflow-x-auto pb-4">
          {APPLICATION_STATUSES.map((s, i) => (hidden.includes(s) ? null : <Column key={s} status={s} number={i + 1} apps={columns.get(s) ?? []} />))}
          {hidden.length === APPLICATION_STATUSES.length && <p className="py-8 text-sm text-muted">Every column is hidden. Turn some back on above.</p>}
        </div>
        <DragOverlay>
          {activeApp ? <div className="rotate-2 scale-105 rounded-control border border-accent/60 bg-card p-3 shadow-[0_28px_50px_-12px_rgb(0_0_0/0.9),0_0_36px_color-mix(in_srgb,var(--color-accent)_35%,transparent)]"><CardBody app={activeApp} /></div> : null}
        </DragOverlay>
      </DndContext>
    </div>
  )
}

export default function BoardPage() {
  const apps = useApplications()
  return (
    <div className="flex flex-col gap-6">
      <PageHeader id="board" title="Board" description="Drag a ticket to another platform. With a keyboard: focus a card, press Space, use the arrow keys, then Space again to drop." />
      <DataGate queries={[apps]}>{() => <BoardContent apps={apps.data!} />}</DataGate>
    </div>
  )
}
