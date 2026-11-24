import type { ReactNode } from 'react'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { StatusBadge } from '@/components/ui/Badge'
import { useDeleteReminder, useReminders, useUpdateReminder } from '@/hooks/useTracker'
import { formatDate, formatDateTime, safeHref } from '@/lib/format'
import { useModalStore } from '@/store/modalStore'
import { EMPLOYMENT_LABELS, REMINDER_LABELS, type Application } from '@/types'
import { cn } from '@/lib/utils'

const Field = ({ label, children }: { label: string; children: ReactNode }) => (
  <div><dt className="text-xs text-muted">{label}</dt><dd className="mt-0.5 text-sm">{children}</dd></div>
)

function ExternalLink({ href, label }: { href: string | null; label: string }) {
  const safe = safeHref(href)
  return safe ? <a href={safe} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">{label}</a> : <>-</>
}

export function ApplicationDetails({ app }: { app: Application }) {
  const open = useModalStore((s) => s.open)
  const updateReminder = useUpdateReminder()
  const deleteReminder = useDeleteReminder()
  const reminders = (useReminders().data ?? []).filter((r) => r.applicationId === app.id).sort((a, b) => a.dueAt.localeCompare(b.dueAt))

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-3">
        <StatusBadge status={app.status} />
        <p className="text-sm text-muted">{app.role} at {app.company}</p>
      </div>

      <dl className="grid grid-cols-2 gap-x-6 gap-y-4">
        <Field label="Location">{app.location ?? '-'}</Field>
        <Field label="Employment type">{EMPLOYMENT_LABELS[app.employmentType]}</Field>
        <Field label="Date applied">{formatDate(app.dateApplied)}</Field>
        <Field label="Deadline">{formatDate(app.deadline)}</Field>
        <Field label="Company website"><ExternalLink href={app.companyWebsite} label="Open website" /></Field>
        <Field label="Application link"><ExternalLink href={app.applicationUrl} label="Open application" /></Field>
      </dl>

      {app.jobDescription && <section><h3 className="text-sm font-medium">Job description</h3><p className="mt-1 text-sm whitespace-pre-wrap text-muted">{app.jobDescription}</p></section>}
      {app.notes && <section><h3 className="text-sm font-medium">Notes</h3><p className="mt-1 text-sm whitespace-pre-wrap text-muted">{app.notes}</p></section>}

      <section>
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium">Reminders and interviews</h3>
          <Button variant="ghost" onClick={() => open({ kind: 'reminder', applicationId: app.id })}><Plus size={16} /> Add</Button>
        </div>
        {reminders.length === 0 ? (
          <p className="mt-2 text-sm text-muted">Nothing scheduled for this application yet.</p>
        ) : (
          <ul className="mt-2 flex flex-col gap-1">
            {reminders.map((r) => (
              <li key={r.id} className="flex items-center gap-3 rounded-control px-2 py-1.5 hover:bg-white/5">
                <input
                  type="checkbox" checked={r.completed} aria-label={`Mark "${r.title}" as done`}
                  onChange={(e) => updateReminder.mutate({ id: r.id, patch: { completed: e.target.checked } })}
                  className="size-4 accent-[var(--color-accent)]"
                />
                <span className={cn('text-sm', r.completed && 'text-muted line-through')}>{r.title}</span>
                <span className="text-xs text-muted">{REMINDER_LABELS[r.type]}</span>
                <span className="ml-auto text-xs text-muted">{formatDateTime(r.dueAt)}</span>
                <button type="button" aria-label={`Delete "${r.title}"`} onClick={() => deleteReminder.mutate(r.id)} className="rounded-control p-1 text-muted hover:text-danger"><Trash2 size={15} /></button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="flex justify-end gap-2">
        <Button variant="secondary" onClick={() => open({ kind: 'delete', id: app.id })}><Trash2 size={16} /> Delete</Button>
        <Button onClick={() => open({ kind: 'edit', id: app.id })}><Pencil size={16} /> Edit</Button>
      </div>
    </div>
  )
}
