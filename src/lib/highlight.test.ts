import { describe, expect, it } from 'vitest'
import { splitMatch } from './highlight'

describe('splitMatch', () => {
  it('returns the text whole when there is nothing to match', () => {
    expect(splitMatch('Sony Music', '')).toEqual([{ text: 'Sony Music', match: false }])
    expect(splitMatch('Sony Music', '   ')).toEqual([{ text: 'Sony Music', match: false }])
    expect(splitMatch('Sony Music', 'zzz')).toEqual([{ text: 'Sony Music', match: false }])
  })

  it('marks the matching part and keeps the original capitals', () => {
    expect(splitMatch('Sony Music', 'MUS')).toEqual([{ text: 'Sony ', match: false }, { text: 'Mus', match: true }, { text: 'ic', match: false }])
  })

  it('marks every occurrence', () => {
    const parts = splitMatch('banana', 'an')
    expect(parts.filter((p) => p.match)).toHaveLength(2)
    expect(parts.map((p) => p.text).join('')).toBe('banana')
  })

  it('handles a match at the very start or end, or the whole text', () => {
    expect(splitMatch('Acme', 'acme')).toEqual([{ text: 'Acme', match: true }])
    expect(splitMatch('Acme Corp', 'acme')[0].match).toBe(true)
    expect(splitMatch('Acme Corp', 'corp').at(-1)?.match).toBe(true)
  })

  it('does not treat symbols in the query as patterns', () => {
    expect(splitMatch('C++ intern (summer)', 'c++').filter((p) => p.match)).toHaveLength(1)
    expect(splitMatch('a.b', '.').filter((p) => p.match)).toHaveLength(1)
  })

  it('never loses or changes any text', () => {
    for (const [text, q] of [['Hello World', 'o'], ['aaaa', 'aa'], ['x', 'x'], ['abc', 'abcd']] as const) {
      expect(splitMatch(text, q).map((p) => p.text).join('')).toBe(text)
    }
  })
})
