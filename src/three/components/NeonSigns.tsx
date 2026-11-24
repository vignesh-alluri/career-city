import { useMemo } from 'react'
import type { BoxSpec } from '../utils/buildingLayout'
import { getGlyph } from '../utils/glyphBitmap'
import { placeSigns } from '../utils/signPlacement'
import { buildSignBoxes } from '../utils/signPixels'
import { PixelBoxes } from './PixelBoxes'

interface NeonSignsProps { boxes: BoxSpec[]; words: readonly string[]; color: string; seed: number; count: number; firstIndex: number; yaw: number }

/**
 * Vertical sign boards (neon, red and yellow) standing on the rooftops, like the signs in the Tokyo street photos.
 * They are built from coloured blocks with the Japanese lettering as raised pixels, so they draw reliably on any graphics card.
 * `yaw` turns the boards to face along the district's own axis, which is the direction the camera looks at it from.
 */
export function NeonSigns({ boxes, words, color, seed, count, firstIndex, yaw }: NeonSignsProps) {
  const items = useMemo(
    () => buildSignBoxes(placeSigns(boxes, words, color, seed, count, firstIndex), getGlyph, yaw),
    [boxes, words, color, seed, count, firstIndex, yaw],
  )
  return <PixelBoxes items={items} />
}
