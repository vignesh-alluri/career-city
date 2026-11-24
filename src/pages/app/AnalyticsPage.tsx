import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { ReactNode } from 'react'
import { Card } from '@/components/ui/Card'
import { PageHeader } from '@/components/ui/PageHeader'
import { TrainMeter } from '@/components/ui/TrainMeter'
import { DataGate } from '@/components/ui/DataGate'
import { EmptyState } from '@/components/ui/EmptyState'
import { useApplications, useReminders } from '@/hooks/useTracker'
import { activitySummary, applicationsOverTime, conversionRates, statusDistribution, weeklyActivity } from '@/selectors/analytics'
import type { Application, ApplicationStatus, Reminder } from '@/types'

const STATUS_COLORS: Record<ApplicationStatus, string> = {
  saved: '#94A3B8', applied: '#38BDF8', assessment: '#FBBF24', interview: '#A78BFA', offered: '#34D399', accepted: '#10B981', rejected: '#F87171',
}
const AXIS = { fontSize: 12, fill: 'var(--color-muted)' }
const TOOLTIP = {
  contentStyle: { background: 'var(--color-card)', border: '1px solid var(--color-line)', borderRadius: 4, color: 'var(--color-ink)' },
  labelStyle: { color: 'var(--color-muted)' }, cursor: { fill: 'rgba(255,255,255,0.04)' },
}
const pct = (rate: number | null) => (rate === null ? '-' : `${Math.round(rate * 100)}%`)

function ChartCard({ title, label, children, footnote }: { title: string; label: string; children: ReactNode; footnote?: ReactNode }) {
  return (
    <Card>
      <h2 className="eyebrow text-ink">{title}</h2>
      <div role="img" aria-label={label} className="mt-4 h-64">{children}</div>
      {footnote && <p className="eyebrow mt-3 border-t border-line pt-3 text-[10px] tracking-[0.14em]">{footnote}</p>}
    </Card>
  )
}

function AnalyticsContent({ apps, reminders }: { apps: Application[]; reminders: Reminder[] }) {
  const now = new Date()
  const conv = conversionRates(apps, reminders)

  if (conv.submitted === 0) {
    return <EmptyState title="Nothing to chart yet" description="Analytics are based on applications you have submitted. Add one with a date applied, or move a saved role to Applied on the board." />
  }

  const over = applicationsOverTime(apps, now)
  const weekly = weeklyActivity(apps, now)
  const activity = activitySummary(weekly)
  const dist = statusDistribution(apps)

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <p className="eyebrow">Interview conversion</p>
          <p className="mt-2 font-display text-5xl font-semibold tabular-nums">{pct(conv.interviewRate)}</p>
          <TrainMeter rate={conv.interviewRate} tone="ember" className="my-3" />
          <p className="text-xs text-muted">{conv.interviewed} of {conv.submitted} submitted applications reached an interview</p>
        </Card>
        <Card>
          <p className="eyebrow">Offer conversion</p>
          <p className="mt-2 font-display text-5xl font-semibold tabular-nums">{pct(conv.offerRate)}</p>
          <TrainMeter rate={conv.offerRate} className="my-3" />
          <p className="text-xs text-muted">{conv.offered} of {conv.submitted} submitted applications led to an offer</p>
        </Card>
      </div>
      <p className="text-xs text-muted">Based on each application's current status plus any interview reminders you logged. Rejections after an interview only count if an interview reminder exists.</p>

      <div className="grid gap-6 xl:grid-cols-2">
        <ChartCard title="Applications over time" label={`Running total of applications over the last 12 weeks, now ${over[over.length - 1].total}`}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={over} margin={{ left: -20, right: 8, top: 8 }}>
              <CartesianGrid stroke="var(--color-line)" vertical={false} />
              <XAxis dataKey="week" tick={AXIS} tickLine={false} axisLine={false} />
              <YAxis allowDecimals={false} tick={AXIS} tickLine={false} axisLine={false} />
              <Tooltip {...TOOLTIP} />
              <Area type="monotone" dataKey="total" name="Total" stroke="var(--color-accent)" fill="var(--color-accent)" fillOpacity={0.15} strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="Weekly activity" label="Applications submitted per week over the last 8 weeks"
          footnote={`${activity.total} submitted / ${activity.average} a week${activity.busiest ? ` / busiest week ${activity.busiest.week} (${activity.busiest.count})` : ''}`}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weekly} margin={{ left: -20, right: 8, top: 8 }}>
              <CartesianGrid stroke="var(--color-line)" vertical={false} />
              <XAxis dataKey="week" tick={AXIS} tickLine={false} axisLine={false} />
              <YAxis allowDecimals={false} tick={AXIS} tickLine={false} axisLine={false} />
              <Tooltip {...TOOLTIP} />
              <Bar dataKey="count" name="Applications" fill="var(--color-ember)" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <div className="xl:col-span-2">
          <ChartCard title="Status distribution" label={`Number of applications in each status: ${dist.map((d) => `${d.label} ${d.count}`).join(', ')}`}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dist} layout="vertical" margin={{ left: 8, right: 16, top: 8 }}>
                <CartesianGrid stroke="rgba(148,163,184,0.12)" horizontal={false} />
                <XAxis type="number" allowDecimals={false} tick={AXIS} tickLine={false} axisLine={false} />
                <YAxis type="category" dataKey="label" width={86} tick={AXIS} tickLine={false} axisLine={false} />
                <Tooltip {...TOOLTIP} />
                <Bar dataKey="count" name="Applications" radius={[0, 2, 2, 0]}>
                  {dist.map((d) => <Cell key={d.status} fill={STATUS_COLORS[d.status]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      </div>
    </div>
  )
}

export default function AnalyticsPage() {
  const apps = useApplications()
  const reminders = useReminders()
  return (
    <div className="flex flex-col gap-6">
      <PageHeader id="analytics" title="Analytics" description="How far your applications get, and how often." />
      <DataGate queries={[apps, reminders]}>{() => <AnalyticsContent apps={apps.data!} reminders={reminders.data!} />}</DataGate>
    </div>
  )
}
