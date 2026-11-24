import { describe, expect, it } from 'vitest'
import { makeApplication } from '@/test/factories'
import { pipelineStations, skylineBuildings } from './pipeline'

describe('pipelineStations', () => {
  it('has five stations and no lit line when there are no applications', () => {
    const p = pipelineStations([])
    expect(p.stations.map((s) => s.id)).toEqual(['saved', 'applied', 'assessment', 'interview', 'offer'])
    expect(p.litIndex).toBe(-1)
    expect(p.rejected).toBe(0)
  })

  it('counts each application at the station for its current status', () => {
    const p = pipelineStations([
      makeApplication({ status: 'saved' }), makeApplication({ status: 'saved' }), makeApplication({ status: 'applied' }),
      makeApplication({ status: 'interview' }),
    ])
    expect(p.stations.map((s) => s.count)).toEqual([2, 1, 0, 1, 0])
  })

  it('lights the line up to the furthest station that has an application, even across empty stations', () => {
    expect(pipelineStations([makeApplication({ status: 'saved' })]).litIndex).toBe(0)
    expect(pipelineStations([makeApplication({ status: 'saved' }), makeApplication({ status: 'interview' })]).litIndex).toBe(3)
  })

  it('puts both offered and accepted at the Offer station', () => {
    const p = pipelineStations([makeApplication({ status: 'offered' }), makeApplication({ status: 'accepted' })])
    expect(p.stations[4].count).toBe(2)
    expect(p.litIndex).toBe(4)
  })

  it('keeps rejected applications off the line and counts them separately', () => {
    const p = pipelineStations([makeApplication({ status: 'rejected' }), makeApplication({ status: 'rejected' })])
    expect(p.stations.every((s) => s.count === 0)).toBe(true)
    expect(p.litIndex).toBe(-1)
    expect(p.rejected).toBe(2)
  })
})

describe('skylineBuildings', () => {
  it('makes one building per application, taller the further along', () => {
    const { buildings, hidden } = skylineBuildings([makeApplication({ status: 'offered' }), makeApplication({ status: 'saved' }), makeApplication({ status: 'interview' })])
    expect(hidden).toBe(0)
    expect(buildings.map((b) => b.level)).toEqual([1, 4, 5])
  })

  it('puts rejected applications last, at level 0', () => {
    const { buildings } = skylineBuildings([makeApplication({ status: 'rejected' }), makeApplication({ status: 'offered' }), makeApplication({ status: 'saved' })])
    expect(buildings.map((b) => b.level)).toEqual([1, 5, 0])
  })

  it('orders applications at the same stage by when they were added', () => {
    const early = makeApplication({ status: 'applied', createdAt: '2026-01-01T00:00:00.000Z' })
    const late = makeApplication({ status: 'applied', createdAt: '2026-06-01T00:00:00.000Z' })
    expect(skylineBuildings([late, early]).buildings.map((b) => b.id)).toEqual([early.id, late.id])
  })

  it('when there are too many, keeps the most advanced and reports how many were left out', () => {
    const apps = [
      ...Array.from({ length: 5 }, () => makeApplication({ status: 'saved' })),
      makeApplication({ status: 'offered' }), makeApplication({ status: 'interview' }),
    ]
    const { buildings, hidden } = skylineBuildings(apps, 3)
    expect(buildings).toHaveLength(3)
    expect(hidden).toBe(4)
    expect(buildings.map((b) => b.level)).toEqual([1, 4, 5])
  })
})
