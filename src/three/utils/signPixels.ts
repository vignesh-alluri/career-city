import type { SignSpec } from './signPlacement'

/** A word as a grid of pixels: lit[row * cols + col] is 1 where the letter has ink. */
export interface Glyph { cols: number; rows: number; lit: ArrayLike<number> }

/** One coloured block of a sign, already in district space (rotation about the up axis = ry). */
export interface SignBox { x: number; y: number; z: number; w: number; h: number; d: number; ry: number; color: string }

const BOARD_DEPTH = 0.07
const PIXEL_DEPTH = 0.025

// Colours per board style. `null` means "use the sign's own neon colour".
const STYLE = {
  neon: { bg: '#0A0716', frame: null, ink: null },
  red: { bg: '#C8202A', frame: '#FFE7E0', ink: '#FFFFFF' },
  yellow: { bg: '#FFD84D', frame: '#3A2A00', ink: '#2A1A00' },
} as const

/**
 * Builds every sign out of plain coloured blocks: a board, a frame, and the lettering as raised pixels on both faces.
 * (The back face is mirrored, so the word reads correctly from either side.) Using blocks instead of a painted texture
 * means the signs draw exactly like the windows and shopfronts do, and it matches the blocky pixel style of the city.
 */
export function buildSignBoxes(signs: SignSpec[], glyphFor: (word: string) => Glyph, yaw: number): SignBox[] {
  const out: SignBox[] = []
  const cos = Math.cos(yaw), sin = Math.sin(yaw)
  // A box given in the sign's own space (x along the board, y up, z out of the front face) -> district space
  const add = (s: SignSpec, lx: number, ly: number, lz: number, w: number, h: number, d: number, color: string) => {
    out.push({ x: s.x + lx * cos + lz * sin, y: s.y + ly, z: s.z - lx * sin + lz * cos, w, h, d, ry: yaw, color })
  }

  for (const s of signs) {
    const style = STYLE[s.style]
    const frame = style.frame ?? s.color
    const ink = style.ink ?? s.color
    add(s, 0, 0, 0, s.w, s.h, BOARD_DEPTH, style.bg)

    const t = Math.min(s.w, s.h) * 0.06
    for (const side of [1, -1]) {
      const z = side * (BOARD_DEPTH / 2 + 0.006)
      add(s, 0, s.h / 2 - t / 2, z, s.w, t, 0.012, frame)
      add(s, 0, -s.h / 2 + t / 2, z, s.w, t, 0.012, frame)
      add(s, -s.w / 2 + t / 2, 0, z, t, s.h - 2 * t, 0.012, frame)
      add(s, s.w / 2 - t / 2, 0, z, t, s.h - 2 * t, 0.012, frame)
    }

    const g = glyphFor(s.word)
    const px = Math.min((s.w * 0.78) / g.cols, (s.h * 0.86) / g.rows)
    const x0 = -(g.cols * px) / 2 + px / 2
    const y0 = (g.rows * px) / 2 - px / 2
    for (let r = 0; r < g.rows; r++) {
      for (let c = 0; c < g.cols; c++) {
        if (!g.lit[r * g.cols + c]) continue
        const lx = x0 + c * px, ly = y0 - r * px
        add(s, lx, ly, BOARD_DEPTH / 2 + PIXEL_DEPTH / 2, px * 0.92, px * 0.92, PIXEL_DEPTH, ink)
        add(s, -lx, ly, -(BOARD_DEPTH / 2 + PIXEL_DEPTH / 2), px * 0.92, px * 0.92, PIXEL_DEPTH, ink)
      }
    }
  }
  return out
}
