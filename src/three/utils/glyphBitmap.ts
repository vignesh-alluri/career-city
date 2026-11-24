import type { Glyph } from './signPixels'

const CHAR = 12 // each character becomes a 12 x 12 grid of pixels
const cache = new Map<string, Glyph>()

/**
 * Turns a word into a grid of lit pixels: it draws the word in white on a tiny hidden canvas and reads the pixels back.
 * Only the SHAPE is taken from the canvas; the sign itself is then built from ordinary coloured blocks, so no
 * texture is ever sent to the graphics card. Needs a browser (canvas); the result is cached per word.
 */
export function getGlyph(text: string): Glyph {
  const hit = cache.get(text)
  if (hit) return hit
  const chars = [...text]
  const cols = CHAR
  const rows = chars.length * CHAR
  const lit = new Uint8Array(cols * rows)

  const canvas = document.createElement('canvas')
  canvas.width = cols
  canvas.height = rows
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (ctx) {
    ctx.fillStyle = '#fff'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.font = `700 ${CHAR - 1}px "Yu Gothic","Meiryo","Hiragino Sans","Noto Sans JP","MS Gothic",sans-serif`
    chars.forEach((ch, i) => ctx.fillText(ch, cols / 2, i * CHAR + CHAR / 2 + 0.5))
    const data = ctx.getImageData(0, 0, cols, rows).data
    for (let i = 0; i < lit.length; i++) lit[i] = data[i * 4 + 3] > 110 ? 1 : 0
  }

  // If the browser has no Japanese font (nothing was drawn), fall back to a simple block pattern, so the sign is never blank.
  if (!lit.some(Boolean)) {
    chars.forEach((_, i) => {
      for (let k = 2; k < 10; k++) { lit[(i * CHAR + 6) * cols + k] = 1; lit[(i * CHAR + k) * cols + 6] = 1 }
    })
  }
  const glyph = { cols, rows, lit }
  cache.set(text, glyph)
  return glyph
}
