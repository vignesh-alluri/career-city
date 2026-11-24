import { format, formatDistanceToNowStrict, parseISO, startOfDay } from 'date-fns'
import { Link } from 'react-router-dom'
import { Plus, SlidersHorizontal } from 'lucide-react'
import { useAuth } from '@/auth/useAuth'
import { Button, buttonClass } from '@/components/ui/Button'
import { DataGate } from '@/components/ui/DataGate'
import { EmptyState } from '@/components/ui/EmptyState'
import { PageHeader } from '@/components/ui/PageHeader'
import { NextDeparture } from '@/components/dashboard/NextDeparture'
import { DepartureBoard, type BoardRow } from '@/components/dashboard/DepartureBoard'
import { PipelineLine } from '@/components/dashboard/PipelineLine'
import { Skyline } from '@/components/dashboard/Skyline'
import { useApplications, useReminders } from '@/hooks/useTracker'
import { nextDeparture } from '@/selectors/nextDeparture'
import { pipelineStations } from '@/selectors/pipeline'
import { deadlineSignal, reminderSignal, type Signal } from '@/selectors/signals'
import { computeStats, upcomingDeadlines } from '@/selectors/stats'
import { useModalStore } from '@/store/modalStore'
import { cn } from '@/lib/utils'
import { usePreferences } from '@/store/preferencesStore'
import { REMINDER_LABELS, type Application, type Reminder } from '@/types'

const plural = (n: number, one: string, many: string) => (n === 1 ? one : many)

const DEADLINE_SIGNAL_TEXT: Record<Signal, string> = {
  green: 'Signal green: no deadlines in the next 14 days', amber: 'Signal amber: deadlines are coming up', red: 'Signal red: a deadline is within 2 days',
}
const REMINDER_SIGNAL_TEXT: Record<Signal, string> = {
  green: 'Signal green: no open reminders', amber: 'Signal amber: you have open reminders', red: 'Signal red: a reminder is overdue',
}

function DashboardContent({ apps, reminders }: { apps: Application[]; reminders: Reminder[] }) {
  const open = useModalStore((s) => s.open)
  const sections = usePreferences((s) => s.dashboard)
  const now = new Date()
  const stats = computeStats(apps, reminders, now)
  const { stations, litIndex, rejected } = pipelineStations(apps)
  const deadlines = upcomingDeadlines(apps, now)
  const next = reminders.filter((r) => !r.completed).sort((a, b) => a.dueAt.localeCompare(b.dueAt)).slice(0, 6)
  const appById = new Map(apps.map((a) => [a.id, a]))
  const dSignal = deadlineSignal(deadlines, now)
  const departure = nextDeparture(apps, reminders, now)
  const rSignal = reminderSignal(next, now)

  if (apps.length === 0) {
    return (
      <EmptyState
        title="No applications yet"
        description="Add the first internship you are interested in, and your dashboard, board, calendar and analytics will start filling in."
        action={
          <Button onClick={() => open({ kind: 'create', defaultStatus: 'saved' })}><Plus size={16} /> Add application</Button>
        }
      />
    )
  }

  const deadlineRows: BoardRow[] = deadlines.map((a) => ({
    key: a.id, when: format(parseISO(a.deadline!), 'd MMM'),
    whenNote: `in ${formatDistanceToNowStrict(startOfDay(parseISO(a.deadline!)), { unit: 'day', roundingMethod: 'ceil' })}`,
    title: a.company, detail: a.role, onSelect: () => open({ kind: 'details', id: a.id }),
  }))

  const reminderRows: BoardRow[] = next.map((r) => {
    const overdue = parseISO(r.dueAt) < now
    const linked = r.applicationId ? appById.get(r.applicationId) : undefined
    return {
      key: r.id, when: format(parseISO(r.dueAt), 'd MMM'), whenNote: overdue ? 'overdue' : format(parseISO(r.dueAt), 'HH:mm'), late: overdue,
      title: r.title, detail: `${REMINDER_LABELS[r.type]}${linked ? `, ${linked.company}` : ''}`,
      onSelect: linked ? () => open({ kind: 'details', id: linked.id }) : undefined,
    }
  })

  return (
    <div className="flex flex-col gap-6">
      {sections.stats && (
        <PipelineLine
          stations={stations} litIndex={litIndex}
          facts={[
            { value: stats.total, label: 'submitted' },
            { value: stats.active, label: 'in progress' },
            { value: stats.interviewsScheduled, label: plural(stats.interviewsScheduled, 'interview booked', 'interviews booked') },
            { value: stats.upcomingDeadlines, label: plural(stats.upcomingDeadlines, 'deadline in 14 days', 'deadlines in 14 days') },
            { value: rejected, label: 'rejected' },
          ]}
        />
      )}

      {sections.stats && departure && (
        <NextDeparture departure={departure} now={now} onOpen={departure.applicationId ? () => open({ kind: 'details', id: departure.applicationId! }) : undefined} />
      )}

      <div className={cn('grid gap-6 lg:grid-cols-2', !sections.deadlines && !sections.upcoming && 'hidden')}>
        {sections.deadlines && (
          <DepartureBoard
            title="Deadlines" count={`${deadlines.length} in 14 days`} rows={deadlineRows}
            signal={dSignal} signalLabel={DEADLINE_SIGNAL_TEXT[dSignal]}
            emptyText="All clear. No saved role is due in the next 14 days."
          />
        )}
        {sections.upcoming && (
          <DepartureBoard
            title="Coming up" count={`${next.length} open`} rows={reminderRows}
            signal={rSignal} signalLabel={REMINDER_SIGNAL_TEXT[rSignal]}
            emptyText="Nothing booked. Add a reminder from the calendar or an application."
          />
        )}
      </div>

      {sections.stats && <Skyline apps={apps} onOpen={(id) => open({ kind: 'details', id })} />}

      {!sections.stats && !sections.deadlines && !sections.upcoming && (
        <p className="text-sm text-muted">Everything on this page is switched off. <Link to="/app/settings" className="text-accent underline">Choose what to show in Settings</Link>.</p>
      )}
    </div>
  )
}

export default function DashboardPage() {
  const apps = useApplications()
  const reminders = useReminders()
  const open = useModalStore((s) => s.open)
  const { user } = useAuth()
  const hour = new Date().getHours()
  const part = hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening'
  const name = user?.displayName ?? user?.email.split('@')[0]
  const greeting = `Good ${part}${name ? `, ${name}` : ''}. Here is where your search stands.`
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        id="dashboard" title="Dashboard" description={`${format(new Date(), 'EEEE d MMMM')}. ${greeting}`}
        actions={<>
          <Link to="/app/settings" className={buttonClass('ghost')}><SlidersHorizontal size={16} /> Customise</Link>
          <Button onClick={() => open({ kind: 'create', defaultStatus: 'saved' })}><Plus size={16} /> Add application</Button>
        </>}
      />
      <DataGate queries={[apps, reminders]}>{() => <DashboardContent apps={apps.data!} reminders={reminders.data!} />}</DataGate>
    </div>
  )
}
