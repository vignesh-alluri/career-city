import type { Application, ApplicationInput, ApplicationStatus, Reminder, ReminderInput } from '@/types'

/**
 * The contract between the UI and wherever data lives. It is implemented by supabaseApplicationService
 * (a Postgres database with Row Level Security). Because screens only depend on this interface, the storage
 * can change again without touching them. Every method returns a Promise because a real database is asynchronous.
 */
export interface ApplicationService {
  listApplications(): Promise<Application[]>
  createApplication(input: ApplicationInput): Promise<Application>
  updateApplication(id: string, patch: Partial<ApplicationInput>): Promise<Application>
  moveApplication(id: string, status: ApplicationStatus): Promise<Application>
  deleteApplication(id: string): Promise<void>

  listReminders(): Promise<Reminder[]>
  createReminder(input: ReminderInput): Promise<Reminder>
  updateReminder(id: string, patch: Partial<ReminderInput & { completed: boolean }>): Promise<Reminder>
  deleteReminder(id: string): Promise<void>
}
