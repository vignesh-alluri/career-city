import { describe, expect, it } from 'vitest'
import { carPosition, trainSpan, type TrainSpec } from './trainPlacement'

const SPEC: TrainSpec = { cars: 6, gap: 0.0118, speed: 0.02 }

describe('carPosition', () => {
  it('starts with the front car at the start and the others trailing behind it', () => {
    expect(carPosition(SPEC, 0, 0)).toBe(0)
    expect(carPosition(SPEC, 1, 0)).toBeCloseTo(1 - 0.0118, 6)
    expect(carPosition(SPEC, 5, 0)).toBeCloseTo(1 - 5 * 0.0118, 6)
  })

  it('moves every car forward by the same distance', () => {
    for (let i = 0; i < SPEC.cars; i++) {
      const a = carPosition(SPEC, i, 0), b = carPosition(SPEC, i, 10)
      expect(((b - a) + 1) % 1).toBeCloseTo(0.2, 6)
    }
  })

  it('keeps the cars the same distance apart all the time, even when the train crosses the start of the loop', () => {
    for (const t of [0, 1, 2.5, 49.9, 50, 123.456]) {
      for (let i = 1; i < SPEC.cars; i++) {
        const front = carPosition(SPEC, i - 1, t), back = carPosition(SPEC, i, t)
        expect(((front - back) + 1) % 1).toBeCloseTo(SPEC.gap, 6)
      }
    }
  })

  it('always stays inside 0 to 1', () => {
    for (let t = 0; t < 200; t += 7.3) for (let i = 0; i < SPEC.cars; i++) {
      const u = carPosition(SPEC, i, t)
      expect(u).toBeGreaterThanOrEqual(0)
      expect(u).toBeLessThan(1)
    }
  })
})

describe('trainSpan', () => {
  it('is short compared with the loop, so the train never bites its own tail', () => {
    expect(trainSpan(SPEC)).toBeCloseTo(0.059, 6)
    expect(trainSpan(SPEC)).toBeLessThan(0.2)
  })
})
