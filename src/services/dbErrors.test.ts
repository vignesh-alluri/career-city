import { describe, expect, it } from 'vitest'
import { friendlyDbError, must } from './dbErrors'

describe('friendlyDbError', () => {
  it('explains network failures', () => {
    expect(friendlyDbError({ message: 'TypeError: Failed to fetch' }).message).toMatch(/internet connection/)
  })

  it('explains an expired session, by message or by code', () => {
    expect(friendlyDbError({ message: 'JWT expired' }).message).toMatch(/log in again/)
    expect(friendlyDbError({ message: 'x', code: 'PGRST301' }).message).toMatch(/log in again/)
  })

  it('maps known Postgres codes to plain sentences', () => {
    expect(friendlyDbError({ message: 'x', code: '42501' }).message).toMatch(/permission/)
    expect(friendlyDbError({ message: 'x', code: '23514' }).message).toMatch(/not allowed/)
    expect(friendlyDbError({ message: 'x', code: '23503' }).message).toMatch(/no longer exists/)
    expect(friendlyDbError({ message: 'x', code: 'PGRST116' }).message).toMatch(/no longer exists/)
  })

  it('never leaks raw database wording for unknown errors', () => {
    const message = friendlyDbError({ message: 'relation "secret_table" does not exist', code: '42P01' }).message
    expect(message).not.toContain('secret_table')
    expect(message).toMatch(/try again/)
  })
})

describe('must', () => {
  it('returns the data when there is no error', () => {
    expect(must({ data: [1, 2], error: null })).toEqual([1, 2])
  })

  it('throws a friendly error when the database reported one', () => {
    expect(() => must({ data: null, error: { message: 'x', code: '42501' } })).toThrow()
  })

  it('throws when the row is missing (for example deleted in another tab)', () => {
    expect(() => must({ data: null, error: null })).toThrow()
    expect(() => must({ data: undefined, error: null })).toThrow()
  })

  it('accepts falsy but real values such as 0 and empty lists', () => {
    expect(must({ data: 0, error: null })).toBe(0)
    expect(must({ data: [], error: null })).toEqual([])
  })
})
