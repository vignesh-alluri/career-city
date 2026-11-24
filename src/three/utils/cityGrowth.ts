import type { Profile } from '../config/layout'
import type { BoxSpec } from './buildingLayout'

const snap = (v: number, step: number) => Math.max(step, Math.round(v / step) * step)
const EMPTY_LOT_HEIGHT = 0.2

export interface GrowthResult { boxes: BoxSpec[]; slots: number; built: number }

/**
 * Turns a district's full layout into the city that matches the user's real data.
 *   - Every building plot is an "empty lot" (a flat, dark pad) until it is built: one application = one building.
 *   - Districts grow outward from their landmark. The Analytics bar chart fills from left to right.
 *   - If there are more applications than plots, the built towers grow taller (up to +60%).
 *   - The landmark is always there. `count === undefined` means "demo city": everything is built.
 * The returned array always has the SAME LENGTH and ORDER as the input, so each building keeps its colours and windows
 * as the city grows (nothing reshuffles when you add an application).
 */
export function applyGrowth(boxes: BoxSpec[], landmarkCount: number, profile: Profile, count: number | undefined): GrowthResult {
  const plots: number[] = []
  for (let i = landmarkCount; i < boxes.length; i++) if (!boxes[i].y0) plots.push(i)
  const slots = plots.length
  if (count === undefined) return { boxes, slots, built: slots }

  const key = (i: number) => (profile === 'bars' ? boxes[i].x : Math.hypot(boxes[i].x, boxes[i].z))
  const order = [...plots].sort((a, b) => key(a) - key(b) || a - b)
  const built = Math.min(Math.max(0, count), slots)
  const builtSet = new Set(order.slice(0, built))
  const boost = count > slots ? 1 + Math.min(0.6, ((count - slots) / Math.max(1, slots)) * 0.6) : 1

  const out = boxes.map((b, i): BoxSpec => {
    if (i < landmarkCount) return b
    if (b.y0) {
      // a rooftop block belongs to the building just before it
      if (!builtSet.has(i - 1)) return { ...b, w: 0.01, d: 0.01, h: 0.01, y0: 0 } // invisible: keeps the index
      return boost === 1 ? b : { ...b, y0: snap(boxes[i - 1].h * boost, 0.4) }
    }
    if (!builtSet.has(i)) return { ...b, h: EMPTY_LOT_HEIGHT, capped: false }
    return boost === 1 ? b : { ...b, h: snap(b.h * boost, 0.4) }
  })
  return { boxes: out, slots, built }
}
