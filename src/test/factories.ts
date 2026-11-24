import type { Application, Reminder } from '@/types'

let counter = 0

/** Builds a complete Application for tests. Pass only the fields the test cares about. */
export function makeApplication(overrides: Partial<Application> = {}): Application {
  counter += 1
  return {
    id: `app-${counter}`, userId: 'user-1', company: 'Acme', role: 'Software Intern',
    companyWebsite: null, jobDescription: null, applicationUrl: null, location: null,
    employmentType: 'internship', status: 'saved', dateApplied: null, deadline: null, notes: null,
    boardPosition: counter, createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  }
}

export function makeReminder(overrides: Partial<Reminder> = {}): Reminder {
  counter += 1
  return { id: `rem-${counter}`, userId: 'user-1', applicationId: null, type: 'custom', title: 'Reminder', dueAt: '2026-11-20T10:00:00.000Z', completed: false, ...overrides }
}
