import { useState, type ReactNode } from 'react'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { useApplications, useDeleteApplication } from '@/hooks/useTracker'
import { useModalStore } from '@/store/modalStore'
import { ApplicationDetails } from './ApplicationDetails'
import { ApplicationForm } from './ApplicationForm'
import { ReminderForm } from './ReminderForm'

function DeleteConfirm({ id, company, onDone }: { id: string; company: string; onDone: () => void }) {
  const remove = useDeleteApplication()
  const [error, setError] = useState<string | null>(null)
  const confirm = async () => {
    try { await remove.mutateAsync(id); onDone() } catch (e) { setError(e instanceof Error ? e.message : 'Could not delete.') }
  }
  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted">This permanently deletes your application to <strong className="text-ink">{company}</strong> and its reminders. This cannot be undone.</p>
      {error && <p role="alert" className="text-sm text-danger">{error}</p>}
      <div className="flex justify-end gap-2">
        <Button variant="ghost" onClick={onDone}>Cancel</Button>
        <Button className="bg-danger text-void hover:bg-danger/85" onClick={confirm} disabled={remove.isPending}>Delete application</Button>
      </div>
    </div>
  )
}

/** The single dialog host. Mounted once in the app shell; the modal store decides what it shows. */
export function ApplicationModals() {
  const modal = useModalStore((s) => s.modal)
  const close = useModalStore((s) => s.close)
  const apps = useApplications().data ?? []
  const app = 'id' in modal ? apps.find((a) => a.id === modal.id) : undefined

  let title = ''
  let body: ReactNode = null
  if (modal.kind === 'create') { title = 'Add application'; body = <ApplicationForm defaultStatus={modal.defaultStatus} onDone={close} /> }
  else if (modal.kind === 'reminder') { title = 'Add reminder'; body = <ReminderForm defaultDate={modal.defaultDate} applicationId={modal.applicationId} onDone={close} /> }
  else if (modal.kind !== 'none') {
    if (!app) { title = 'Not found'; body = <p className="text-sm text-muted">This application no longer exists.</p> }
    else if (modal.kind === 'edit') { title = `Edit ${app.company}`; body = <ApplicationForm application={app} onDone={() => useModalStore.getState().open({ kind: 'details', id: app.id })} /> }
    else if (modal.kind === 'details') { title = app.company; body = <ApplicationDetails app={app} /> }
    else if (modal.kind === 'delete') { title = 'Delete application?'; body = <DeleteConfirm id={app.id} company={app.company} onDone={close} /> }
  }

  return <Modal open={modal.kind !== 'none'} onClose={close} title={title} size={modal.kind === 'details' ? 'lg' : 'md'}>{body}</Modal>
}
