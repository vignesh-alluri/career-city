import { describe, expect, it } from 'vitest'
import { createShortcutMatcher, type KeyInfo } from './shortcuts'

const k = (key: string, extra: Partial<KeyInfo> = {}): KeyInfo => ({ key, ctrlKey: false, metaKey: false, altKey: false, ...extra })

describe('createShortcutMatcher', () => {
  it('maps the single keys', () => {
    const m = createShortcutMatcher()
    expect(m(k('n'), 0)).toBe('new-application')
    expect(m(k('r'), 0)).toBe('new-reminder')
    expect(m(k('/'), 0)).toBe('focus-search')
    expect(m(k('?'), 0)).toBe('help')
    expect(m(k('x'), 0)).toBeNull()
  })

  it('opens quick find with Ctrl+K or Cmd+K, in either case', () => {
    const m = createShortcutMatcher()
    expect(m(k('k', { ctrlKey: true }), 0)).toBe('palette')
    expect(m(k('K', { metaKey: true }), 0)).toBe('palette')
  })

  it('treats "g" then a letter as go-to, but only within the time limit', () => {
    const m = createShortcutMatcher(1000)
    expect(m(k('g'), 0)).toBeNull()
    expect(m(k('d'), 500)).toBe('go:dashboard')
    expect(m(k('g'), 2000)).toBeNull()
    expect(m(k('b'), 3500)).toBeNull() // too late
    expect(m(k('g'), 5000)).toBeNull()
    expect(m(k('c'), 5200)).toBe('go:calendar')
  })

  it('uses the go-to key only once', () => {
    const m = createShortcutMatcher()
    m(k('g'), 0)
    expect(m(k('a'), 100)).toBe('go:applications')
    expect(m(k('a'), 200)).toBeNull()
  })

  it('does not hijack browser shortcuts or Alt combinations', () => {
    const m = createShortcutMatcher()
    expect(m(k('n', { ctrlKey: true }), 0)).toBeNull()
    expect(m(k('n', { altKey: true }), 0)).toBeNull()
    expect(m(k('r', { metaKey: true }), 0)).toBeNull()
  })

  it('lets a non-go key after "g" fall through to its own meaning', () => {
    const m = createShortcutMatcher()
    m(k('g'), 0)
    expect(m(k('n'), 100)).toBe('new-application')
  })
})
