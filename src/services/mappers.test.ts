import { describe, expect, it } from 'vitest'
import type { Database } from '@/types/database'
import { patchToRow, toApplication, toEmploymentType, toReminder } from './mappers'

type AppRow = Database['public']['Tables']['applications']['Row']
type ReminderRow = Database['public']['Tables']['reminders']['Row']

const row = (over: Partial<AppRow> = {}): AppRow => ({
  id: 'a1', user_id: 'u1', company: 'Acme', role: 'Dev', company_website: null, job_description: null, application_url: null,
  location: 'Tokyo', employment_type: 'internship', status: 'applied', date_applied: '2026-03-01', deadline: null, notes: null,
  board_position: 3, created_at: '2026-03-01T09:00:00+00:00', updated_at: '2026-03-02T09:00:00+00:00', ...over,
})

describe('toApplication', () => {
  it('renames snake_case columns to camelCase', () => {
    const a = toApplication(row())
    expect(a.userId).toBe('u1')
    expect(a.dateApplied).toBe('2026-03-01')
    expect(a.boardPosition).toBe(3)
    expect(a.location).toBe('Tokyo')
  })

  it('normalises Postgres timestamps to the Z form', () => {
    const a = toApplication(row())
    expect(a.createdAt).toBe('2026-03-01T09:00:00.000Z')
    expect(a.updatedAt).toBe('2026-03-02T09:00:00.000Z')
  })

  it('turns an unknown employment type into other instead of crashing', () => {
    expect(toApplication(row({ employment_type: 'apprenticeship' })).employmentType).toBe('other')
    expect(toEmploymentType('placement')).toBe('placement')
  })
})

describe('toReminder', () => {
  it('maps every field', () => {
    const r: ReminderRow = { id: 'r1', user_id: 'u1', application_id: 'a1', type: 'interview', title: 'Call', due_at: '2026-11-20T10:00:00+00:00', completed: true, created_at: '2026-01-01T00:00:00+00:00' } as ReminderRow
    expect(toReminder(r)).toEqual({ id: 'r1', userId: 'u1', applicationId: 'a1', type: 'interview', title: 'Call', dueAt: '2026-11-20T10:00:00.000Z', completed: true })
  })
})

describe('patchToRow', () => {
  it('leaves untouched fields undefined, so a patch only changes what it names', () => {
    const r = patchToRow({ notes: 'hello' })
    expect(r.notes).toBe('hello')
    expect(r.company).toBeUndefined()
    expect(r.status).toBeUndefined()
  })

  it('keeps null, which clears a column', () => {
    expect(patchToRow({ deadline: null }).deadline).toBeNull()
  })

  it('never lets a client set the owner or the board position', () => {
    const r = patchToRow({ company: 'X' }) as Record<string, unknown>
    expect('user_id' in r).toBe(false)
    expect('board_position' in r).toBe(false)
  })
})
