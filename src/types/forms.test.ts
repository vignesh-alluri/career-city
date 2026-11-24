import { describe, expect, it } from 'vitest'
import { makeApplication } from '@/test/factories'
import {
  applicationFormSchema, applicationToForm, blankApplicationForm, formToApplicationInput, formToReminderInput,
  loginSchema, registerSchema, reminderFormSchema,
} from './forms'

/** Collects the FIRST message for each field, which is what react-hook-form shows under an input. */
function firstErrors(result: { success: boolean; error?: { issues: { path: PropertyKey[]; message: string }[] } }): Record<string, string> {
  const out: Record<string, string> = {}
  for (const issue of result.error?.issues ?? []) {
    const key = issue.path.join('.')
    if (!(key in out)) out[key] = issue.message
  }
  return out
}

const validApp = { ...blankApplicationForm('saved'), company: 'Sony', role: 'Software Intern' }

describe('applicationFormSchema', () => {
  it('accepts a minimal valid form', () => {
    expect(applicationFormSchema.safeParse(validApp).success).toBe(true)
  })

  it('trims text, so what is saved has no stray spaces', () => {
    const r = applicationFormSchema.safeParse({ ...validApp, company: '  Sony  ' })
    expect(r.success && r.data.company).toBe('Sony')
  })

  it('rejects an empty or whitespace-only company', () => {
    expect(firstErrors(applicationFormSchema.safeParse({ ...validApp, company: '' })).company).toBe('Enter the company name')
    expect(firstErrors(applicationFormSchema.safeParse({ ...validApp, company: '   ' })).company).toBe('Enter the company name')
  })

  it('enforces the length limits that match the database', () => {
    expect(applicationFormSchema.safeParse({ ...validApp, company: 'a'.repeat(120) }).success).toBe(true)
    expect(firstErrors(applicationFormSchema.safeParse({ ...validApp, company: 'a'.repeat(121) })).company).toBe('Keep it under 120 characters')
    expect(applicationFormSchema.safeParse({ ...validApp, notes: 'n'.repeat(5000) }).success).toBe(true)
    expect(firstErrors(applicationFormSchema.safeParse({ ...validApp, notes: 'n'.repeat(5001) })).notes).toBe('Keep it under 5000 characters')
    expect(firstErrors(applicationFormSchema.safeParse({ ...validApp, jobDescription: 'j'.repeat(5001) })).jobDescription).toBe('Keep it under 5000 characters')
  })

  it('accepts only full http(s) links, or nothing', () => {
    const msg = 'Enter a full link starting with http:// or https://'
    expect(applicationFormSchema.safeParse({ ...validApp, companyWebsite: '' }).success).toBe(true)
    expect(applicationFormSchema.safeParse({ ...validApp, companyWebsite: 'https://acme.com/jobs' }).success).toBe(true)
    expect(firstErrors(applicationFormSchema.safeParse({ ...validApp, companyWebsite: 'acme.com' })).companyWebsite).toBe(msg)
    expect(firstErrors(applicationFormSchema.safeParse({ ...validApp, applicationUrl: 'ftp://acme.com' })).applicationUrl).toBe(msg)
    expect(firstErrors(applicationFormSchema.safeParse({ ...validApp, applicationUrl: 'javascript:alert(1)' })).applicationUrl).toBe(msg)
  })

  it('needs a date applied for every status except Saved (matches the database rule)', () => {
    expect(applicationFormSchema.safeParse({ ...validApp, status: 'saved', dateApplied: '' }).success).toBe(true)
    expect(firstErrors(applicationFormSchema.safeParse({ ...validApp, status: 'applied', dateApplied: '' })).dateApplied).toBe('Add the date you applied')
    expect(applicationFormSchema.safeParse({ ...validApp, status: 'interview', dateApplied: '2026-03-01' }).success).toBe(true)
  })

  it('rejects malformed dates and unknown choices', () => {
    expect(firstErrors(applicationFormSchema.safeParse({ ...validApp, deadline: '2026-3-1' })).deadline).toBe('Enter a valid date')
    expect(applicationFormSchema.safeParse({ ...validApp, status: 'aplied' }).success).toBe(false)
    expect(applicationFormSchema.safeParse({ ...validApp, employmentType: 'volunteer' }).success).toBe(false)
  })
})

describe('reminderFormSchema', () => {
  const valid = { title: 'Call recruiter', type: 'follow_up', date: '2026-11-20', time: '09:30', applicationId: '' }

  it('accepts a valid reminder, with or without a linked application', () => {
    expect(reminderFormSchema.safeParse(valid).success).toBe(true)
    expect(reminderFormSchema.safeParse({ ...valid, applicationId: 'abc' }).success).toBe(true)
  })

  it('rejects a missing title, date or time with a helpful message', () => {
    expect(firstErrors(reminderFormSchema.safeParse({ ...valid, title: ' ' })).title).toBe('Enter a title')
    expect(firstErrors(reminderFormSchema.safeParse({ ...valid, date: '' })).date).toBe('Choose a date')
    expect(firstErrors(reminderFormSchema.safeParse({ ...valid, time: '9:30' })).time).toBe('Choose a time')
  })
})

describe('loginSchema', () => {
  it('accepts a normal login and trims the email', () => {
    const r = loginSchema.safeParse({ email: ' me@uni.ac.uk ', password: 'x' })
    expect(r.success && r.data.email).toBe('me@uni.ac.uk')
  })

  it('shows "Enter your email" first for an empty email, and a format message for a bad one', () => {
    expect(firstErrors(loginSchema.safeParse({ email: '', password: 'x' })).email).toBe('Enter your email')
    expect(firstErrors(loginSchema.safeParse({ email: 'not-an-email', password: 'x' })).email).toBe('Enter a valid email address')
    expect(firstErrors(loginSchema.safeParse({ email: 'me@uni.ac.uk', password: '' })).password).toBe('Enter your password')
  })
})

describe('registerSchema', () => {
  const valid = { displayName: 'Aiko', email: 'aiko@example.com', password: 'longenough', confirmPassword: 'longenough' }

  it('accepts a valid registration', () => {
    expect(registerSchema.safeParse(valid).success).toBe(true)
  })

  it('reports mismatched passwords under the confirm field', () => {
    expect(firstErrors(registerSchema.safeParse({ ...valid, confirmPassword: 'different1' })).confirmPassword).toBe('The passwords do not match')
  })

  it('enforces password length from 8 to 72 characters', () => {
    expect(firstErrors(registerSchema.safeParse({ ...valid, password: 'short', confirmPassword: 'short' })).password).toBe('Use at least 8 characters')
    const long = 'p'.repeat(73)
    expect(firstErrors(registerSchema.safeParse({ ...valid, password: long, confirmPassword: long })).password).toBe('Use 72 characters or fewer')
    const edge = 'p'.repeat(72)
    expect(registerSchema.safeParse({ ...valid, password: edge, confirmPassword: edge }).success).toBe(true)
  })
})

describe('form conversion helpers', () => {
  it('turns empty form fields into null for the database', () => {
    const input = formToApplicationInput({ ...validApp, company: ' Sony ' })
    expect(input.company).toBe('Sony')
    expect(input.location).toBeNull()
    expect(input.dateApplied).toBeNull()
    expect(input.notes).toBeNull()
  })

  it('round-trips an application through the form without losing anything', () => {
    const app = makeApplication({ status: 'applied', dateApplied: '2026-03-01', location: 'Tokyo', notes: 'hello', deadline: null })
    const back = formToApplicationInput(applicationToForm(app))
    expect(back.company).toBe(app.company)
    expect(back.status).toBe('applied')
    expect(back.dateApplied).toBe('2026-03-01')
    expect(back.location).toBe('Tokyo')
    expect(back.deadline).toBeNull()
  })

  it('builds the reminder time from the chosen local date and time', () => {
    const r = formToReminderInput({ title: ' Call ', type: 'interview', date: '2026-11-20', time: '09:30', applicationId: '' })
    const due = new Date(r.dueAt)
    expect(r.title).toBe('Call')
    expect(r.applicationId).toBeNull()
    expect([due.getFullYear(), due.getMonth(), due.getDate(), due.getHours(), due.getMinutes()]).toEqual([2026, 10, 20, 9, 30])
  })
})
