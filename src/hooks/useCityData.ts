import { useMemo } from 'react'
import { computeCityMetrics } from '@/selectors/city'
import { useApplications, useReminders } from './useTracker'

/**
 * Connects the tracker data to the city. Follows the project's dependency flow:
 * database -> services -> query hooks -> selectors -> components. The 3D scene never queries anything; it only
 * receives the plain numbers this hook produces.
 */
export function useCityData() {
  const applications = useApplications()
  const reminders = useReminders()
  const metrics = useMemo(
    () => (applications.data && reminders.data ? computeCityMetrics(applications.data, reminders.data, new Date()) : null),
    [applications.data, reminders.data],
  )
  return { applications, reminders, metrics }
}
