/**
 * What the cursor water is doing right now, kept so Settings can show it. If the ripples ever look rough, this says which drawing
 * method is running and how fine it is, instead of guessing. (Plain module-level data: it is only read when Settings is drawn.)
 */
export interface WaterStatus { kind: 'gl' | '2d' | 'off'; cell: number; steppedDown: boolean }

let status: WaterStatus = { kind: 'off', cell: 0, steppedDown: false }
export const getWaterStatus = (): WaterStatus => status
export const setWaterStatus = (next: WaterStatus): void => { status = next }

/** One plain sentence for Settings. */
export function describeWater(s: WaterStatus): string {
  if (s.kind === 'off') return 'Not running on this page.'
  const how = s.kind === 'gl' ? 'smooth, on the graphics card' : 'basic canvas (this browser has no WebGL 2)'
  return `${how}, ${s.cell} px cells${s.steppedDown ? ', reduced because frames were slow' : ''}.`
}
