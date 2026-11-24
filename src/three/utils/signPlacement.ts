import type { BoxSpec } from './buildingLayout'
import { createRng } from './random'
import { signAspect } from './signMetrics'
import { COLORS } from '../config/palette'

export type SignStyle = 'neon' | 'red' | 'yellow'
export interface SignSpec { x: number; y: number; z: number; w: number; h: number; word: string; color: string; style: SignStyle }

const STYLES: SignStyle[] = ['neon', 'red', 'neon', 'yellow', 'neon']
const MIN_SPACING = 1.3

/**
 * Chooses where the vertical sign boards stand. They are planted ON ROOFS (not on walls), because in a tightly packed
 * block most walls are hidden between neighbouring buildings, but a board standing above the roofline is seen from the
 * high camera and from outside the district. Buildings before `firstIndex` (the district landmark) are skipped.
 */
export function placeSigns(boxes: BoxSpec[], words: readonly string[], color: string, seed: number, count: number, firstIndex: number): SignSpec[] {
  const rng = createRng(seed + 99)
  const palette = [color, COLORS.pink, COLORS.accent, COLORS.orange]

  const candidates: { i: number; top: number }[] = []
  for (let i = firstIndex; i < boxes.length; i++) {
    const b = boxes[i]
    if (b.y0) continue // rooftop blocks are handled with the building they sit on
    const cap = b.capped ? boxes[i + 1] : undefined
    const top = cap ? (cap.y0 ?? 0) + cap.h : b.h
    if (b.h > 0.5 && top >= 1.0) candidates.push({ i, top }) // dark empty lots (flat) never carry signs
  }
  for (let i = candidates.length - 1; i > 0; i--) { // Fisher-Yates shuffle with the seeded generator
    const j = Math.floor(rng() * (i + 1))
    ;[candidates[i], candidates[j]] = [candidates[j], candidates[i]]
  }

  // Tallest roofs first: a board on a roof that stands above its neighbours is seen from every side, while one on a
  // low roof between towers is hidden. The shuffle above only decides ties between equally tall roofs.
  candidates.sort((a, b) => b.top - a.top)

  const out: SignSpec[] = []
  for (const c of candidates) {
    if (out.length >= count) break
    const b = boxes[c.i]
    if (out.some((s) => Math.hypot(s.x - b.x, s.z - b.z) < MIN_SPACING)) continue
    const k = out.length
    const word = words[k % words.length]
    const h = 1.1 + rng() * 0.5
    out.push({ x: b.x, z: b.z, y: c.top + 0.07 + h / 2, w: h * signAspect(word), h, word, color: palette[k % palette.length], style: STYLES[k % STYLES.length] })
  }
  return out
}
