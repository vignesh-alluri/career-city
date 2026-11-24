import { useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { Plus, Search, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { ApplicationTicket } from '@/components/applications/ApplicationTicket'
import { PageHeader } from '@/components/ui/PageHeader'
import { DataGate } from '@/components/ui/DataGate'
import { EmptyState } from '@/components/ui/EmptyState'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { useApplications } from '@/hooks/useTracker'
import { DEFAULT_FILTERS, filterApplications, SORT_LABELS, type Filters, type SortKey } from '@/selectors/applications'
import { useModalStore } from '@/store/modalStore'
import { APPLICATION_STATUSES, STATUS_LABELS, type Application, type ApplicationStatus } from '@/types'
import { cn } from '@/lib/utils'

function ApplicationsContent({ apps }: { apps: Application[] }) {
  const open = useModalStore((s) => s.open)
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS)
  const visible = useMemo(() => filterApplications(apps, filters), [apps, filters])
  const location = useLocation()
  const counts = useMemo(() => {
    const c = Object.fromEntries(APPLICATION_STATUSES.map((s) => [s, 0])) as Record<ApplicationStatus, number>
    for (const a of apps) c[a.status]++
    return c
  }, [apps])

  // arriving from the "/" shortcut on another page: put the cursor straight into the search box
  useEffect(() => {
    if ((location.state as { focusSearch?: boolean } | null)?.focusSearch) document.querySelector<HTMLInputElement>('[data-app-search]')?.focus()
  }, [location.state])

  if (apps.length === 0) {
    return <EmptyState title="No applications yet" description="Add your first internship to start tracking it." action={<Button onClick={() => open({ kind: 'create', defaultStatus: 'saved' })}><Plus size={16} /> Add application</Button>} />
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-3 md:grid-cols-[2fr_1fr]">
        <div className="relative">
          <Search size={16} aria-hidden className="pointer-events-none absolute top-[2.35rem] left-3 text-muted" />
          <Input label="Search by company or role" data-app-search className="w-full pr-9 pl-9" value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} placeholder="Search..." />
          {filters.search && (
            <button type="button" aria-label="Clear search" onClick={() => setFilters({ ...filters, search: '' })} className="absolute top-[1.85rem] right-1.5 rounded-control p-1.5 text-muted hover:bg-white/5 hover:text-ink"><X size={15} /></button>
          )}
        </div>
        <Select label="Sort by" value={filters.sort} onChange={(e) => setFilters({ ...filters, sort: e.target.value as SortKey })}>
          {(Object.keys(SORT_LABELS) as SortKey[]).map((k) => <option key={k} value={k}>{SORT_LABELS[k]}</option>)}
        </Select>
      </div>

      <div role="group" aria-label="Filter by status" className="flex flex-wrap gap-2">
        {(['all', ...APPLICATION_STATUSES] as const).map((s) => (
          <button
            key={s} type="button" aria-pressed={filters.status === s} onClick={() => setFilters({ ...filters, status: s })}
            className={cn('rounded-[3px] border px-2.5 py-1 font-mono text-xs tracking-wider uppercase transition-colors', filters.status === s ? 'border-accent bg-accent/15 text-accent' : 'border-line text-muted hover:border-accent/40 hover:text-ink')}
          >
            {s === 'all' ? 'All' : STATUS_LABELS[s]} <span className="ml-1 text-xs opacity-70">{s === 'all' ? apps.length : counts[s]}</span>
          </button>
        ))}
      </div>

      <p className="eyebrow" role="status">{visible.length} of {apps.length} {apps.length === 1 ? 'ticket' : 'tickets'}</p>

      {visible.length === 0 ? (
        <EmptyState title="Nothing matches" description="Try a different search or status." action={<Button variant="secondary" onClick={() => setFilters(DEFAULT_FILTERS)}>Clear filters</Button>} />
      ) : (
        <ul className="flex flex-col gap-3">
          {visible.map((a, i) => (
            <ApplicationTicket
              key={a.id} app={a} index={i} query={filters.search}
              onOpen={() => open({ kind: 'details', id: a.id })} onEdit={() => open({ kind: 'edit', id: a.id })} onDelete={() => open({ kind: 'delete', id: a.id })}
            />
          ))}
        </ul>
      )}
    </div>
  )
}

export default function ApplicationsPage() {
  const apps = useApplications()
  const open = useModalStore((s) => s.open)
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        id="applications" title="Applications" description="Every internship you are tracking, as a ticket. The number on the stub is its station on your line."
        actions={<Button onClick={() => open({ kind: 'create', defaultStatus: 'saved' })}><Plus size={16} /> Add application</Button>}
      />
      <DataGate queries={[apps]}>{() => <ApplicationsContent apps={apps.data!} />}</DataGate>
    </div>
  )
}
