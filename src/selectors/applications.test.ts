import { describe, expect, it } from 'vitest'
import { makeApplication } from '@/test/factories'
import { DEFAULT_FILTERS, filterApplications } from './applications'

const google = makeApplication({ company: 'Google', role: 'SWE Intern', status: 'applied', dateApplied: '2026-03-01', deadline: '2026-04-01' })
const stripe = makeApplication({ company: 'Stripe', role: 'Data Intern', status: 'interview', dateApplied: '2026-05-01', deadline: null })
const notion = makeApplication({ company: 'Notion', role: 'Design Intern', status: 'saved', dateApplied: null, deadline: '2026-03-15' })
const all = [google, stripe, notion]
const names = (list: typeof all) => list.map((a) => a.company)

describe('filterApplications', () => {
  it('returns everything by default, newest applied first, undated last', () => {
    expect(names(filterApplications(all, DEFAULT_FILTERS))).toEqual(['Stripe', 'Google', 'Notion'])
  })

  it('searches company and role, ignoring case', () => {
    expect(names(filterApplications(all, { ...DEFAULT_FILTERS, search: 'GOO' }))).toEqual(['Google'])
    expect(names(filterApplications(all, { ...DEFAULT_FILTERS, search: 'data' }))).toEqual(['Stripe'])
    expect(filterApplications(all, { ...DEFAULT_FILTERS, search: '  intern ' })).toHaveLength(3)
    expect(filterApplications(all, { ...DEFAULT_FILTERS, search: 'zzz' })).toHaveLength(0)
  })

  it('filters by status', () => {
    expect(names(filterApplications(all, { ...DEFAULT_FILTERS, status: 'saved' }))).toEqual(['Notion'])
  })

  it('sorts oldest first but still puts missing dates last', () => {
    expect(names(filterApplications(all, { ...DEFAULT_FILTERS, sort: 'applied-asc' }))).toEqual(['Google', 'Stripe', 'Notion'])
  })

  it('sorts by deadline in both directions with missing deadlines last', () => {
    expect(names(filterApplications(all, { ...DEFAULT_FILTERS, sort: 'deadline-asc' }))).toEqual(['Notion', 'Google', 'Stripe'])
    expect(names(filterApplications(all, { ...DEFAULT_FILTERS, sort: 'deadline-desc' }))).toEqual(['Google', 'Notion', 'Stripe'])
  })

  it('does not change the list it was given', () => {
    const before = names(all)
    filterApplications(all, { ...DEFAULT_FILTERS, sort: 'deadline-asc' })
    expect(names(all)).toEqual(before)
  })
})
