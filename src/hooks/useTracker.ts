import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { applicationService } from '@/services'
import type { Application, ApplicationInput, ApplicationStatus, ReminderInput } from '@/types'

export const trackerKeys = { applications: ['applications'] as const, reminders: ['reminders'] as const }

export const useApplications = () => useQuery({ queryKey: trackerKeys.applications, queryFn: () => applicationService.listApplications() })
export const useReminders = () => useQuery({ queryKey: trackerKeys.reminders, queryFn: () => applicationService.listReminders() })

export function useCreateApplication() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: ApplicationInput) => applicationService.createApplication(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: trackerKeys.applications }),
  })
}

export function useUpdateApplication() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<ApplicationInput> }) => applicationService.updateApplication(id, patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: trackerKeys.applications }),
  })
}

/**
 * Optimistic update: the card jumps to its new column immediately, and is rolled back if saving fails.
 * Waiting for storage/the network before moving a dragged card would feel broken.
 */
export function useMoveApplication() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: ApplicationStatus }) => applicationService.moveApplication(id, status),
    onMutate: async ({ id, status }) => {
      await qc.cancelQueries({ queryKey: trackerKeys.applications })
      const previous = qc.getQueryData<Application[]>(trackerKeys.applications)
      qc.setQueryData<Application[]>(trackerKeys.applications, (old) => old?.map((a) => (a.id === id ? { ...a, status } : a)))
      return { previous }
    },
    onError: (_error, _vars, context) => {
      if (context?.previous) qc.setQueryData(trackerKeys.applications, context.previous)
    },
    onSettled: () => qc.invalidateQueries({ queryKey: trackerKeys.applications }),
  })
}

export function useDeleteApplication() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => applicationService.deleteApplication(id),
    onSuccess: () => qc.invalidateQueries(),
  })
}

export function useCreateReminder() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: ReminderInput) => applicationService.createReminder(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: trackerKeys.reminders }),
  })
}

export function useUpdateReminder() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<ReminderInput & { completed: boolean }> }) => applicationService.updateReminder(id, patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: trackerKeys.reminders }),
  })
}

export function useDeleteReminder() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => applicationService.deleteReminder(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: trackerKeys.reminders }),
  })
}
