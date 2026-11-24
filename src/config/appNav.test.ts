import { describe, expect, it } from 'vitest'
import { activeNavIndex, APP_NAV, platformNumber } from './appNav'

describe('activeNavIndex', () => {
  it('lights the dashboard only for /app itself', () => {
    expect(activeNavIndex('/app')).toBe(0)
    expect(activeNavIndex('/app/')).toBe(0)
  })

  it('lights each page for its own address', () => {
    APP_NAV.forEach((n, i) => { if (!n.end) expect(activeNavIndex(n.to)).toBe(i) })
  })

  it('keeps a page lit for addresses below it, but not for look-alike prefixes', () => {
    expect(activeNavIndex('/app/board/anything')).toBe(2)
    expect(activeNavIndex('/app/boards')).toBe(-1)
  })

  it('lights nothing for unknown addresses', () => {
    expect(activeNavIndex('/')).toBe(-1)
    expect(activeNavIndex('/app/nope')).toBe(-1)
  })
})

describe('platformNumber', () => {
  it('counts the sidebar from 1', () => {
    expect(platformNumber('dashboard')).toBe(1)
    expect(platformNumber('settings')).toBe(APP_NAV.length)
  })
})
