import {
  EMPLOYMENT_TYPES,
  type Application, type ApplicationInput, type EmploymentType, type Reminder,
} from '@/types'
import type { Database } from '@/types/database'

type ApplicationRow = Database['public']['Tables']['applications']['Row']
type ApplicationUpdate = Database['public']['Tables']['applications']['Update']
type ReminderRow = Database['public']['Tables']['reminders']['Row']

// Postgres returns timestamps like "2026-11-14T09:00:00+00:00"; normalise to the "...Z" form the rest of the app uses.
const iso = (value: string) => new Date(value).toISOString()

/* Mapping: database rows use snake_case, the app uses camelCase. Pure functions, so they are tested without a database. */

export function toEmploymentType(value: string): EmploymentType {
  return (EMPLOYMENT_TYPES as readonly string[]).includes(value) ? (value as EmploymentType) : 'other'
}

export function toApplication(r: ApplicationRow): Application {
  return {
    id: r.id, userId: r.user_id, company: r.company, role: r.role,
    companyWebsite: r.company_website, jobDescription: r.job_description, applicationUrl: r.application_url,
    location: r.location, employmentType: toEmploymentType(r.employment_type), status: r.status,
    dateApplied: r.date_applied, deadline: r.deadline, notes: r.notes,
    boardPosition: r.board_position, createdAt: iso(r.created_at), updatedAt: iso(r.updated_at),
  }
}

/**
 * Fields that are `undefined` are left out of the request entirely (JSON drops them), so a patch only touches
 * what it names. A field set to `null` clears the column.
 */
export function patchToRow(p: Partial<ApplicationInput>): ApplicationUpdate {
  return {
    company: p.company, role: p.role, company_website: p.companyWebsite, job_description: p.jobDescription,
    application_url: p.applicationUrl, location: p.location, employment_type: p.employmentType,
    status: p.status, date_applied: p.dateApplied, deadline: p.deadline, notes: p.notes,
  }
}

export function toReminder(r: ReminderRow): Reminder {
  return { id: r.id, userId: r.user_id, applicationId: r.application_id, type: r.type, title: r.title, dueAt: iso(r.due_at), completed: r.completed }
}

