import type { CityQuality } from '@/types'
import type { BoxSpec } from './buildingLayout'
import { createRng } from './random'
import { buildingTheme, type BuildingTheme } from './windows'

/** One small block of detail: shopfronts, awnings, floor ledges, glowing corner strips, rooftop machinery. */
export interface DetailBox { x: number; y: number; z: number; w: number; h: number; d: number; color: string }

const SHOP = ['#FFC27A', '#FFE0A8', '#FFC27A', '#6FD8FF', '#FF9CC8']        // lit shop windows, mostly warm
const AWNING = ['#C8202A', '#FFD84D', '#2447B8', '#1E8A5A', '#C8202A']       // shop awnings in typical Japanese colours
const STRIP: Record<BuildingTheme, string> = { blue: '#35D9FF', magenta: '#FF3D9A', orange: '#FF8A3D', concrete: '#FFD07A', mixed: '#A66BFF' }
const LEDGE = '#34427A', UNIT = '#6B7BB0', TANK = '#56659A', MAST = '#9FB0E0'
const ROOF_LIP = 0.07 // the roof edge drawn by Building sits this far above the top of the walls

/**
 * Adds the small details that make a block of boxes read as a real street: a lit shopfront and an awning at street
 * level, a ledge line every few floors, glowing strips down some corners, and air-conditioning units, water tanks and
 * radio masts on the roofs. Everything is a plain coloured box, so the whole district draws in one GPU call.
 * Empty lots and vanished rooftop blocks get no details, so a new city starts bare and fills in as it grows.
 */
export function buildDetails(boxes: BoxSpec[], seed: number, quality: CityQuality): DetailBox[] {
  const rng = createRng(seed + 7)
  const full = quality === 'high'
  const out: DetailBox[] = []
  const pick = <T,>(list: readonly T[]) => list[Math.floor(rng() * list.length)]

  boxes.forEach((b, i) => {
    if (b.h < 0.3) return
    const base = b.y0 ?? 0
    const top = base + b.h

    if (!b.y0) {
      out.push({ x: b.x, y: 0.15, z: b.z, w: b.w * 1.04, h: 0.3, d: b.d * 1.04, color: pick(SHOP) })
      out.push({ x: b.x, y: 0.36, z: b.z, w: b.w * 1.12, h: 0.06, d: b.d * 1.12, color: pick(AWNING) })
      if (full) {
        for (let y = 0.9; y < b.h - 0.25; y += 0.8) out.push({ x: b.x, y, z: b.z, w: b.w * 1.035, h: 0.035, d: b.d * 1.035, color: LEDGE })
        if (b.h >= 1.6 && rng() < 0.35) {
          const sx = rng() < 0.5 ? -1 : 1, sz = rng() < 0.5 ? -1 : 1
          const h = b.h * 0.85
          out.push({ x: b.x + sx * (b.w / 2 + 0.012), y: 0.35 + h / 2, z: b.z + sz * (b.d / 2 + 0.012), w: 0.04, h, d: 0.04, color: STRIP[buildingTheme(seed, i)] })
        }
      }
    }

    if (!b.capped) {
      // the roof of a building with a smaller block on top is hidden, so only the top-most block gets machinery
      const roofY = top + ROOF_LIP
      const units = 1 + Math.floor(rng() * (full ? 3 : 2))
      for (let k = 0; k < units; k++) {
        const w = 0.12 + rng() * 0.12, h = 0.08 + rng() * 0.1
        const reach = Math.max(0.05, b.w / 2 - 0.12)
        out.push({
          x: b.x + (rng() < 0.5 ? -1 : 1) * reach * (0.4 + rng() * 0.6), y: roofY + h / 2,
          z: b.z + (rng() < 0.5 ? -1 : 1) * Math.max(0.05, b.d / 2 - 0.12) * (0.4 + rng() * 0.6),
          w, h, d: w * (0.8 + rng() * 0.4), color: UNIT,
        })
      }
      if (full && b.h > 1.2 && rng() < 0.3) {
        const x = b.x - Math.max(0.05, b.w / 2 - 0.14), z = b.z - Math.max(0.05, b.d / 2 - 0.14)
        out.push({ x, y: roofY + 0.11, z, w: 0.16, h: 0.22, d: 0.16, color: TANK })
        out.push({ x, y: roofY + 0.24, z, w: 0.19, h: 0.04, d: 0.19, color: TANK })
      }
      if (full && rng() < 0.35) {
        const h = 0.5 + rng() * 0.5
        out.push({ x: b.x + Math.max(0.05, b.w / 2 - 0.1), y: roofY + h / 2, z: b.z + Math.max(0.05, b.d / 2 - 0.1), w: 0.025, h, d: 0.025, color: MAST })
      }
    }
  })
  return out
}
