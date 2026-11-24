import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Textarea'
import { useCreateApplication, useUpdateApplication } from '@/hooks/useTracker'
import {
  applicationFormSchema, applicationToForm, blankApplicationForm, formToApplicationInput, type ApplicationFormValues,
} from '@/types/forms'
import { APPLICATION_STATUSES, EMPLOYMENT_LABELS, EMPLOYMENT_TYPES, STATUS_LABELS, type Application, type ApplicationStatus } from '@/types'

interface Props { application?: Application; defaultStatus?: ApplicationStatus; onDone: () => void }

/**
 * react-hook-form tracks the fields; the zod resolver validates them against applicationFormSchema.
 * `register('company')` wires one input into the form (value, change, blur, ref).
 */
export function ApplicationForm({ application, defaultStatus = 'saved', onDone }: Props) {
  const create = useCreateApplication()
  const update = useUpdateApplication()
  const [serverError, setServerError] = useState<string | null>(null)
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ApplicationFormValues>({
    resolver: zodResolver(applicationFormSchema),
    defaultValues: application ? applicationToForm(application) : blankApplicationForm(defaultStatus),
  })

  const onSubmit = async (values: ApplicationFormValues) => {
    setServerError(null)
    try {
      const input = formToApplicationInput(values)
      if (application) await update.mutateAsync({ id: application.id, patch: input })
      else await create.mutateAsync(input)
      onDone()
    } catch (e) {
      setServerError(e instanceof Error ? e.message : 'Something went wrong while saving.')
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="Company" {...register('company')} error={errors.company?.message} autoFocus />
        <Input label="Job role" {...register('role')} error={errors.role?.message} />
        <Select label="Status" {...register('status')} error={errors.status?.message}>
          {APPLICATION_STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
        </Select>
        <Select label="Employment type" {...register('employmentType')} error={errors.employmentType?.message}>
          {EMPLOYMENT_TYPES.map((t) => <option key={t} value={t}>{EMPLOYMENT_LABELS[t]}</option>)}
        </Select>
        <Input label="Date applied" type="date" {...register('dateApplied')} error={errors.dateApplied?.message} />
        <Input label="Application deadline" type="date" {...register('deadline')} error={errors.deadline?.message} />
        <Input label="Location" {...register('location')} error={errors.location?.message} />
        <Input label="Company website" type="url" placeholder="https://" {...register('companyWebsite')} error={errors.companyWebsite?.message} />
      </div>
      <Input label="Application URL" type="url" placeholder="https://" {...register('applicationUrl')} error={errors.applicationUrl?.message} />
      <Textarea label="Job description" {...register('jobDescription')} error={errors.jobDescription?.message} />
      <Textarea label="Personal notes" {...register('notes')} error={errors.notes?.message} />
      {serverError && <p role="alert" className="text-sm text-danger">{serverError}</p>}
      <div className="flex justify-end gap-2">
        <Button variant="ghost" onClick={onDone}>Cancel</Button>
        <Button type="submit" disabled={isSubmitting}>{application ? 'Save changes' : 'Add application'}</Button>
      </div>
    </form>
  )
}
