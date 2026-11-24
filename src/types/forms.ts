import { z } from 'zod'
import {
  APPLICATION_STATUSES, EMPLOYMENT_TYPES, REMINDER_TYPES,
  type Application, type ApplicationInput, type ApplicationStatus, type ReminderInput,
} from '@/types'

const isHttpUrl = (v: string) => {
  try { const u = new URL(v); return u.protocol === 'http:' || u.protocol === 'https:' } catch { return false }
}
// The limits match the database CHECK constraints, so a value the form accepts is never rejected on save.
const optionalUrl = (max: number) => z.string().trim()
  .max(max, `Keep it under ${max} characters`)
  .refine((v) => v === '' || isHttpUrl(v), 'Enter a full link starting with http:// or https://')
const optionalDate = z.string().refine((v) => v === '' || /^\d{4}-\d{2}-\d{2}$/.test(v), 'Enter a valid date')

/** Zod describes what a valid form looks like. The same schema gives us validation messages AND the TypeScript type. */
export const applicationFormSchema = z.object({
  company: z.string().trim().min(1, 'Enter the company name').max(120, 'Keep it under 120 characters'),
  role: z.string().trim().min(1, 'Enter the job role').max(120, 'Keep it under 120 characters'),
  companyWebsite: optionalUrl(300),
  applicationUrl: optionalUrl(500),
  location: z.string().trim().max(120, 'Keep it under 120 characters'),
  employmentType: z.enum(EMPLOYMENT_TYPES),
  status: z.enum(APPLICATION_STATUSES),
  dateApplied: optionalDate,
  deadline: optionalDate,
  jobDescription: z.string().max(5000, 'Keep it under 5000 characters'),
  notes: z.string().max(5000, 'Keep it under 5000 characters'),
}).superRefine((v, ctx) => {
  if (v.status !== 'saved' && v.dateApplied === '') {
    ctx.addIssue({ code: 'custom', path: ['dateApplied'], message: 'Add the date you applied' })
  }
})
export type ApplicationFormValues = z.infer<typeof applicationFormSchema>

export const blankApplicationForm = (status: ApplicationStatus = 'saved'): ApplicationFormValues => ({
  company: '', role: '', companyWebsite: '', applicationUrl: '', location: '', employmentType: 'internship',
  status, dateApplied: '', deadline: '', jobDescription: '', notes: '',
})

export const applicationToForm = (a: Application): ApplicationFormValues => ({
  company: a.company, role: a.role, companyWebsite: a.companyWebsite ?? '', applicationUrl: a.applicationUrl ?? '',
  location: a.location ?? '', employmentType: a.employmentType, status: a.status,
  dateApplied: a.dateApplied ?? '', deadline: a.deadline ?? '', jobDescription: a.jobDescription ?? '', notes: a.notes ?? '',
})

const orNull = (s: string) => (s.trim() === '' ? null : s.trim())
export const formToApplicationInput = (v: ApplicationFormValues): ApplicationInput => ({
  company: v.company.trim(), role: v.role.trim(), companyWebsite: orNull(v.companyWebsite), applicationUrl: orNull(v.applicationUrl),
  location: orNull(v.location), employmentType: v.employmentType, status: v.status,
  dateApplied: orNull(v.dateApplied), deadline: orNull(v.deadline), jobDescription: orNull(v.jobDescription), notes: orNull(v.notes),
})

export const reminderFormSchema = z.object({
  title: z.string().trim().min(1, 'Enter a title').max(120, 'Keep it under 120 characters'),
  type: z.enum(REMINDER_TYPES),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Choose a date'),
  time: z.string().regex(/^\d{2}:\d{2}$/, 'Choose a time'),
  applicationId: z.string(), // '' means "not linked to an application"
})
export type ReminderFormValues = z.infer<typeof reminderFormSchema>

export function formToReminderInput(v: ReminderFormValues): ReminderInput {
  const [y, m, d] = v.date.split('-').map(Number)
  const [hh, mm] = v.time.split(':').map(Number)
  return { title: v.title.trim(), type: v.type, applicationId: v.applicationId || null, dueAt: new Date(y, m - 1, d, hh, mm).toISOString() }
}

/* ---------- Authentication forms ---------- */

export const loginSchema = z.object({
  email: z.string().trim().min(1, 'Enter your email').email('Enter a valid email address'),
  password: z.string().min(1, 'Enter your password'),
})
export type LoginValues = z.infer<typeof loginSchema>

export const registerSchema = z.object({
  displayName: z.string().trim().max(80, 'Keep it under 80 characters'),
  email: z.string().trim().min(1, 'Enter your email').email('Enter a valid email address'),
  password: z.string().min(8, 'Use at least 8 characters').max(72, 'Use 72 characters or fewer'),
  confirmPassword: z.string(),
}).refine((v) => v.password === v.confirmPassword, { path: ['confirmPassword'], message: 'The passwords do not match' })
export type RegisterValues = z.infer<typeof registerSchema>
