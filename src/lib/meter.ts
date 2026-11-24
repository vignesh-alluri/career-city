/** How many cars of a train-shaped meter are lit for a rate between 0 and 1. A missing rate (nothing to measure yet) lights none. */
export function litCars(rate: number | null, total = 10): number {
  if (rate === null || !Number.isFinite(rate)) return 0
  return Math.round(Math.min(1, Math.max(0, rate)) * total)
}
