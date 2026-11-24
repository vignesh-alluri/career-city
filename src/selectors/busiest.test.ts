import { describe, expect, it } from 'vitest'
import { busiest } from './busiest'

describe('busiest', () => {
  it('is null when nothing has been built', () => {
    expect(busiest({ a: 0, b: 0 }, ['a', 'b'])).toBeNull()
    expect(busiest({}, ['a'])).toBeNull()
  })

  it('finds the highest count', () => {
    expect(busiest({ a: 1, b: 4, c: 2 }, ['a', 'b', 'c'])).toEqual({ id: 'b', count: 4 })
  })

  it('takes the first when tied, and ignores ids that are not asked about', () => {
    expect(busiest({ a: 3, b: 3 }, ['a', 'b'])).toEqual({ id: 'a', count: 3 })
    expect(busiest({ a: 1, analytics: 9 }, ['a'])).toEqual({ id: 'a', count: 1 })
  })
})
