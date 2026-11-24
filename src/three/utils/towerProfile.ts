/**
 * The silhouette of the Tokyo Tower, taken from the reference photo: a wide base whose legs sweep inwards steeply at first and
 * then rise almost straight, a main observation deck about 55% of the way up the lattice, a top deck, and a long antenna.
 * All numbers are in city units. Kept free of any 3D library so it can be tested on its own.
 */
export const TOWER = {
  baseHalf: 1.4,       // half the width of the base
  topHalf: 0.2,        // half the width of the lattice at the top deck
  mainY: 4.9,          // height of the main observation deck
  topY: 8.8,           // height of the top deck
  antennaStart: 8.95,
  antennaBands: 7,
  bandHeight: 0.5,
  // Heights of the horizontal rings of the lattice. Closer together near the bottom, where the legs curve the most.
  ringHeights: [0, 0.7, 1.45, 2.2, 3.0, 3.9, 4.9, 5.7, 6.5, 7.3, 8.1, 8.8],
} as const

/** Height of the very tip of the antenna. */
export const TOWER_TOP = TOWER.antennaStart + TOWER.antennaBands * TOWER.bandHeight

/** Half the width of the lattice at height y. The power of 2.4 gives the concave curve of the real legs. */
export function towerHalfWidthAt(y: number): number {
  const t = Math.min(1, Math.max(0, y / TOWER.topY))
  return TOWER.topHalf + (TOWER.baseHalf - TOWER.topHalf) * Math.pow(1 - t, 2.4)
}
