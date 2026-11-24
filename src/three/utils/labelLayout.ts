export interface LabelInsets { left: number; right: number; top: number; bottom: number }

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v))

/**
 * Keeps a label's centre inside the visible area, away from the edges and the page header, so a label can never slide off
 * screen. If the area is too small for the insets, the label is centred instead of being pushed to an impossible spot.
 */
export function clampLabel(x: number, y: number, width: number, height: number, inset: LabelInsets): { x: number; y: number } {
  const place = (v: number, size: number, lo: number, hi: number) => (size - lo - hi <= 0 ? size / 2 : clamp(v, lo, size - hi))
  return { x: place(x, width, inset.left, inset.right), y: place(y, height, inset.top, inset.bottom) }
}
