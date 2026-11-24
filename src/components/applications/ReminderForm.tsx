import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { format } from 'date-fns'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { useApplications, useCreateReminder } from '@/hooks/useTracker'
import { formToReminderInput, reminderFormSchema, type ReminderFormValues } from '@/types/forms'
import { REMINDER_LABELS, REMINDER_TYPES } from '@/types'

interface Props { defaultDate?: string; applicationId?: string | null; onDone: () => void }

export function ReminderForm({ defaultDate, applicationId, onDone }: Props) {
  const create = useCreateReminder()
  const apps = useApplications().data ?? []
  const [serverError, setServerError] = useState<string | null>(null)
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ReminderFormValues>({
    resolver: zodResolver(reminderFormSchema),
    defaultValues: { title: '', type: 'interview', date: defaultDate ?? format(new Date(), 'yyyy-MM-dd'), time: '09:00', applicationId: applicationId ?? '' },
  })

  const onSubmit = async (values: ReminderFormValues) => {
    setServerError(null)
    try {
      await create.mutateAsync(formToReminderInput(values))
      onDone()
    } catch (e) {
      setServerError(e instanceof Error ? e.message : 'Something went wrong while saving.')
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
      <Input label="Title" placeholder="e.g. Technical interview" {...register('title')} error={errors.title?.message} autoFocus />
      <div className="grid gap-4 sm:grid-cols-3">
        <Select label="Type" {...register('type')} error={errors.type?.message}>
          {REMINDER_TYPES.map((t) => <option key={t} value={t}>{REMINDER_LABELS[t]}</option>)}
        </Select>
        <Input label="Date" type="date" {...register('date')} error={errors.date?.message} />
        <Input label="Time" type="time" {...register('time')} error={errors.time?.message} />
      </div>
      <Select label="Linked application (optional)" {...register('applicationId')}>
        <option value="">None</option>
        {apps.map((a) => <option key={a.id} value={a.id}>{a.company}, {a.role}</option>)}
      </Select>
      {serverError && <p role="alert" className="text-sm text-danger">{serverError}</p>}
      <div className="flex justify-end gap-2">
        <Button variant="ghost" onClick={onDone}>Cancel</Button>
        <Button type="submit" disabled={isSubmitting}>Add reminder</Button>
      </div>
    </form>
  )
}
