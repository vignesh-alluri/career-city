import type { BoxSpec } from './buildingLayout'
import { createRng } from './random'
import { WINDOW_COLORS } from '../config/palette'

/** A building leans towards one colour family, so whole blocks look blue, magenta or orange. */
export type BuildingTheme = 'blue' | 'magenta' | 'orange' | 'concrete' | 'mixed'

/** tone = index into WINDOW_COLORS; WINDOW_COLORS.length means the district's own colour. */
export interface WindowSpec { x: number; y: number; z: number; ry: number; tone: number }

/** The same building always gets the same theme, so its windows and its body tint agree. */
export function buildingTheme(seed: number, index: number): BuildingTheme {
  const r = createRng((seed + Math.imul(index + 1, 2654435761)) >>> 0)()
  return r < 0.2 ? 'blue' : r < 0.4 ? 'magenta' : r < 0.55 ? 'orange' : r < 0.8 ? 'concrete' : 'mixed'
}

// [tone index, weight] pairs per theme
const MIX: Record<BuildingTheme, ReadonlyArray<readonly [number, number]>> = {
  blue: [[0, 0.25], [1, 0.4], [2, 0.25], [7, 0.1]],
  magenta: [[3, 0.4], [4, 0.25], [0, 0.2], [7, 0.15]],
  orange: [[5, 0.4], [6, 0.35], [0, 0.15], [3, 0.1]],
  concrete: [[6, 0.4], [0, 0.3], [5, 0.15], [1, 0.15]], // warm yellow shop and office windows
  mixed: [[0, 0.25], [1, 0.15], [3, 0.15], [5, 0.2], [6, 0.15], [2, 0.1]],
}

function pickTone(rng: () => number, theme: BuildingTheme): number {
  if (rng() < 0.1) return WINDOW_COLORS.length // a pixel in the district's own colour ties the block to its district
  let r = rng()
  for (const [tone, weight] of MIX[theme]) {
    r -= weight
    if (r <= 0) return tone
  }
  return MIX[theme][0][0]
}

// A tight grid of small square "pixels", closer to the dense lit facades in the reference than big windows.
const COL_SPACING = 0.2
const ROW_SPACING = 0.22

/**
 * Lays out lit pixels on all four walls of every building. Only lit pixels are created:
 * dark ones simply don't exist, which keeps the instance count (and GPU work) down.
 */
export function generateWindows(boxes: BoxSpec[], litFraction: number, seed: number): WindowSpec[] {
  const rng = createRng(seed)
  const out: WindowSpec[] = []
  const EPS = 0.012 // float the window just off the wall to avoid z-fighting

  boxes.forEach((b, index) => {
    const theme = buildingTheme(seed, index)
    // nx/nz = which way the wall faces; ry = rotation so the flat plane faces outwards
    const faces = [
      { nx: 0, nz: 1, len: b.w, ry: 0 },
      { nx: 0, nz: -1, len: b.w, ry: Math.PI },
      { nx: 1, nz: 0, len: b.d, ry: Math.PI / 2 },
      { nx: -1, nz: 0, len: b.d, ry: -Math.PI / 2 },
    ]
    for (const f of faces) {
      const cols = Math.max(0, Math.floor((f.len - 0.16) / COL_SPACING))
      const rows = Math.max(0, Math.floor((b.h - 0.3) / ROW_SPACING))
      for (let c = 0; c < cols; c++) {
        const u = (c - (cols - 1) / 2) * COL_SPACING
        for (let r = 0; r < rows; r++) {
          if (rng() > litFraction) continue
          out.push({
            x: b.x + (f.nx !== 0 ? f.nx * (b.w / 2 + EPS) : u),
            y: (b.y0 ?? 0) + 0.32 + r * ROW_SPACING,
            z: b.z + (f.nz !== 0 ? f.nz * (b.d / 2 + EPS) : u),
            ry: f.ry,
            tone: pickTone(rng, theme),
          })
        }
      }
    }
  })
  return out
}
