import { describe, expect, it } from 'vitest'
import { rankItems, scoreItem, type PaletteItem } from './commandSearch'

const item = (id: string, label: string, extra: Partial<PaletteItem> = {}): PaletteItem => ({ id, label, group: 'Go to', ...extra })
const items = [
  item('board', 'Board', { keywords: 'kanban columns' }),
  item('cal', 'Calendar', { keywords: 'schedule interviews' }),
  item('add', 'Add application', { group: 'Actions' }),
  item('app', 'Applications'),
  item('goog', 'Google · SWE Intern', { group: 'Applications' }),
]

describe('scoreItem', () => {
  it('scores nothing typed as a match for everything', () => {
    expect(scoreItem('', items[0])).toBeGreaterThan(0)
  })

  it('prefers a label that starts with the word, then a word inside it, then a mention anywhere', () => {
    const start = scoreItem('ap', item('a', 'Applications'))
    const inside = scoreItem('ap', item('b', 'Add application'))
    const anywhere = scoreItem('plic', item('c', 'Applications'))
    expect(start).toBeGreaterThan(inside - 0.001)
    expect(inside).toBeGreaterThan(anywhere)
  })

  it('needs every typed word to match', () => {
    expect(scoreItem('add application', items[2])).toBeGreaterThan(0)
    expect(scoreItem('add banana', items[2])).toBe(0)
  })

  it('also looks in the hidden keywords, ignoring capitals and accents', () => {
    expect(scoreItem('KANBAN', items[0])).toBeGreaterThan(0)
    expect(scoreItem('café', item('x', 'Cafe menu'))).toBeGreaterThan(0)
  })

  it('accepts scattered letters for longer words only', () => {
    expect(scoreItem('cld', items[1])).toBeGreaterThan(0)
    expect(scoreItem('cd', items[1])).toBe(0)
  })
})

describe('rankItems', () => {
  it('keeps the given order when nothing is typed', () => {
    expect(rankItems('', items).map((i) => i.id)).toEqual(['board', 'cal', 'add', 'app', 'goog'])
  })

  it('puts the best match first and drops non-matches', () => {
    expect(rankItems('cal', items).map((i) => i.id)).toEqual(['cal'])
    expect(rankItems('app', items)[0].id).toBe('app')
  })

  it('finds a company by name', () => {
    expect(rankItems('goog', items)[0].id).toBe('goog')
  })

  it('respects the limit', () => {
    expect(rankItems('', items, 2)).toHaveLength(2)
  })
})
