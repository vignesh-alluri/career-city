import type { CityEffects } from '@/lib/preferences'
import type { CityQuality } from '@/types'

/** What the 3D city is allowed to spend on looks. The expensive parts are the mirror reflections and the size of the water. */
export interface EffectsPlan {
  /** true = the cheaper version of the city */
  lite: boolean
  /** The wet street mirrors the city. This draws the whole city a second time every frame, so it is the biggest single cost. */
  reflections: boolean
  /** The water is a square grid this many cells wide. Cost grows with the SQUARE of this number. */
  waterCells: number
  rainStreaks: number
  /** The highest pixel density the picture may use (1 = one pixel per CSS pixel). */
  maxDpr: number
}

/**
 * Decides what to switch on.
 *  quality   'low' is a phone or touch screen: always the cheap version.
 *  setting   the person's choice in Settings.
 *  degraded  true once the city has measured itself running too slowly (only matters when the setting is 'auto').
 */
export function planEffects(quality: CityQuality, setting: CityEffects, degraded: boolean): EffectsPlan {
  if (quality === 'low') return { lite: true, reflections: false, waterCells: 128, rainStreaks: 350, maxDpr: 1 }
  const lite = setting === 'light' || (setting === 'auto' && degraded)
  return lite
    ? { lite: true, reflections: false, waterCells: 128, rainStreaks: 450, maxDpr: 1.25 }
    : { lite: false, reflections: true, waterCells: 256, rainStreaks: 900, maxDpr: 1.5 }
}

/**
 * Pixel density for a measured "performance factor" (0 = struggling, 1 = comfortable).
 * Fewer pixels means less work for the graphics card, at the price of a slightly softer picture. Never below 1, rounded to 0.05.
 */
export function adaptiveDpr(factor: number, maxDpr: number): number {
  const f = Math.min(1, Math.max(0, factor))
  return Math.round((1 + (maxDpr - 1) * f) * 20) / 20
}
