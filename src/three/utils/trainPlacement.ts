/**
 * Where each car of the train sits on its loop. Positions are fractions of the loop (0 to 1).
 * Pure maths, so it is tested; the 3D component only turns these numbers into matrices.
 */
export interface TrainSpec { cars: number; /** fraction of the loop between the centres of two cars */ gap: number; /** loops per second */ speed: number }

/** Fraction of the loop (0 to 1, wrapped) for car `index` at `time` seconds. Car 0 is the front; the others trail behind it. */
export function carPosition(spec: TrainSpec, index: number, time: number): number {
  const u = (spec.speed * time - index * spec.gap) % 1
  return (u + 1) % 1
}

/** The loop is long compared with the train. Returns the length of the whole train as a fraction of the loop. */
export function trainSpan(spec: TrainSpec): number {
  return (spec.cars - 1) * spec.gap
}
