/**
 * Core domain types. These mirror the database tables in supabase/migrations (the database itself uses snake_case
 * column names; src/services/supabaseApplicationService.ts translates between the two).
 * A TypeScript "union of string literals" restricts a value to an exact set of strings,
 * so a typo like 'aplied' becomes a compile error instead of a runtime bug.
 */
export const APPLICATION_STATUSES = [
  'saved', 'applied', 'assessment', 'interview', 'offered', 'accepted', 'rejected',
] as const
export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number]

export const EMPLOYMENT_TYPES = ['internship', 'placement', 'part_time', 'full_time', 'other'] as const
export type EmploymentType = (typeof EMPLOYMENT_TYPES)[number]

export interface Application {
  id: string
  userId: string
  company: string
  role: string
  companyWebsite: string | null
  jobDescription: string | null
  applicationUrl: string | null
  location: string | null
  employmentType: EmploymentType
  status: ApplicationStatus
  dateApplied: string | null // ISO date, e.g. "2026-03-14"
  deadline: string | null
  notes: string | null
  boardPosition: number
  createdAt: string
  updatedAt: string
}

export const REMINDER_TYPES = ['interview', 'follow_up', 'deadline', 'custom'] as const
export type ReminderType = (typeof REMINDER_TYPES)[number]

export interface Reminder {
  id: string
  userId: string
  applicationId: string | null
  type: ReminderType
  title: string
  dueAt: string // ISO timestamp
  completed: boolean
}

export const DISTRICT_IDS = ['discovery', 'application', 'interview', 'achievement', 'analytics'] as const
export type DistrictId = (typeof DISTRICT_IDS)[number]

/** 'low' = phones and touch devices: fewer buildings, no fog, no user camera control. */
export type CityQuality = 'high' | 'low'

/** What a form collects. The service adds id, owner, board position and timestamps. */
export type ApplicationInput = Omit<Application, 'id' | 'userId' | 'boardPosition' | 'createdAt' | 'updatedAt'>
export type ReminderInput = Omit<Reminder, 'id' | 'userId' | 'completed'>

export const STATUS_LABELS: Record<ApplicationStatus, string> = {
  saved: 'Saved', applied: 'Applied', assessment: 'Assessment', interview: 'Interview',
  offered: 'Offered', accepted: 'Accepted', rejected: 'Rejected',
}
export const EMPLOYMENT_LABELS: Record<EmploymentType, string> = {
  internship: 'Internship', placement: 'Placement year', part_time: 'Part-time', full_time: 'Full-time', other: 'Other',
}
export const REMINDER_LABELS: Record<ReminderType, string> = {
  interview: 'Interview', follow_up: 'Follow-up', deadline: 'Deadline', custom: 'Reminder',
}
