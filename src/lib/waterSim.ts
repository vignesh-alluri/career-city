/** A rectangle of cells, both ends included. */
export interface Bounds { x0: number; y0: number; x1: number; y1: number }

/** Water smaller than this (in height and in speed) counts as still. Cells below it are left alone until something stirs them again. */
const STILL = 1e-4

export interface WaterOptions {
  /** How quickly a bump pulls on its neighbours, which sets how fast waves travel. Must stay below 0.5 or the maths blows up. */
  stiffness?: number
  /** Share of motion kept each step (1 = never calms down). Real water loses a little energy every moment. */
  damping?: number
}

/**
 * A small patch of water as a grid of heights, using the wave equation:
 *  1. each cell is pulled towards the average of its four neighbours (that pull is what makes a bump spread out as a ring),
 *  2. the pull changes the cell's speed, and the speed changes its height,
 *  3. a little energy is lost every step, so ripples fade out instead of ringing forever.
 * Where waves meet they add and cancel exactly like real ripples, which is why this looks natural. The border absorbs waves,
 * so they leave the edge instead of bouncing back. Pure maths with no 3D or browser code, so it is tested on its own.
 *
 * Most of the time most of the water is flat, so the simulation remembers a rectangle that holds everything that is moving
 * (`activeBounds`) and only works on that. Waves can travel one cell per step, so the rectangle grows by one cell a step, and
 * shrinks again as the ripples fade. That makes a fine grid cheap: the cost follows the size of the ripples, not the size of the screen.
 */
export class WaterSim {
  readonly cols: number
  readonly rows: number
  /** The water height of every cell; row by row, so cell (x, y) is height[y * cols + x]. */
  readonly height: Float32Array
  private readonly velocity: Float32Array
  private readonly damp: Float32Array
  private readonly stiffness: number
  /** The largest height (up or down) after the latest step. Near zero means the water is calm. */
  maxAbs = 0
  private bounds: Bounds | null = null

  /** The rectangle that holds all the moving water, or null when everything is still. Outside it the water is flat. */
  get activeBounds(): Bounds | null { return this.bounds }

  constructor(cols: number, rows: number, { stiffness = 0.16, damping = 0.994 }: WaterOptions = {}) {
    this.cols = cols
    this.rows = rows
    this.stiffness = Math.min(stiffness, 0.45)
    this.height = new Float32Array(cols * rows)
    this.velocity = new Float32Array(cols * rows)
    this.damp = new Float32Array(cols * rows)
    // Near the border the damping gets stronger and stronger, soaking up waves so they do not reflect.
    const margin = Math.max(4, Math.round(Math.min(cols, rows) * 0.08))
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const edge = Math.min(x, cols - 1 - x, y, rows - 1 - y)
        this.damp[y * cols + x] = damping * (edge >= margin ? 1 : 0.84 + (0.16 * edge) / margin)
      }
    }
  }

  /** Advances the water by one tick (the app runs 60 a second). */
  step(): void {
    const b = this.bounds
    if (!b) { this.maxAbs = 0; return }
    const { cols, rows, height: h, velocity: v, damp, stiffness } = this
    // work on the moving part, plus one cell all round for the wave to spread into
    const x0 = Math.max(1, b.x0 - 1), x1 = Math.min(cols - 2, b.x1 + 1)
    const y0 = Math.max(1, b.y0 - 1), y1 = Math.min(rows - 2, b.y1 + 1)
    for (let y = y0; y <= y1; y++) {
      for (let x = x0; x <= x1; x++) {
        const k = y * cols + x
        const pull = h[k - 1] + h[k + 1] + h[k - cols] + h[k + cols] - 4 * h[k]
        v[k] = (v[k] + pull * stiffness) * damp[k]
      }
    }
    let max = 0
    let nx0 = cols, nx1 = -1, ny0 = rows, ny1 = -1 // the rectangle round the cells that are still moving after this step
    for (let y = y0; y <= y1; y++) {
      for (let x = x0; x <= x1; x++) {
        const k = y * cols + x
        h[k] += v[k]
        const a = Math.abs(h[k])
        if (a > max) max = a
        if (a > STILL || Math.abs(v[k]) > STILL) {
          if (x < nx0) nx0 = x
          if (x > nx1) nx1 = x
          if (y < ny0) ny0 = y
          if (y > ny1) ny1 = y
        }
      }
    }
    this.maxAbs = max
    this.bounds = nx1 < 0 ? null : { x0: nx0, y0: ny0, x1: nx1, y1: ny1 }
  }

  /** Pushes (positive) or dips (negative) the surface with a soft round bump at (x, y), in cell units. `radius` is the bump's spread. */
  disturb(x: number, y: number, radius: number, amount: number): void {
    const { cols, rows, height: h } = this
    const reach = Math.ceil(radius * 3)
    const x0 = Math.max(1, Math.floor(x - reach)), x1 = Math.min(cols - 2, Math.ceil(x + reach))
    const y0 = Math.max(1, Math.floor(y - reach)), y1 = Math.min(rows - 2, Math.ceil(y + reach))
    const twoSigma = 2 * radius * radius
    for (let j = y0; j <= y1; j++) {
      for (let i = x0; i <= x1; i++) {
        const dx = i - x, dy = j - y
        h[j * cols + i] += amount * Math.exp(-(dx * dx + dy * dy) / twoSigma)
      }
    }
    this.maxAbs = Math.max(this.maxAbs, Math.abs(amount))
    const b = this.bounds
    this.bounds = b ? { x0: Math.min(b.x0, x0), y0: Math.min(b.y0, y0), x1: Math.max(b.x1, x1), y1: Math.max(b.y1, y1) } : { x0, y0, x1, y1 }
  }

  /** Drags a finger through the water from one point to another. Many small dips along the line leave a continuous wake. */
  stroke(x0: number, y0: number, x1: number, y1: number, radius: number, amount: number): void {
    const length = Math.hypot(x1 - x0, y1 - y0)
    const samples = Math.max(1, Math.min(120, Math.ceil(length / (radius * 0.7))))
    for (let s = 1; s <= samples; s++) {
      const t = s / samples
      this.disturb(x0 + (x1 - x0) * t, y0 + (y1 - y0) * t, radius, amount * 0.55)
    }
  }

  /** Flattens the water completely. */
  reset(): void {
    this.height.fill(0)
    this.velocity.fill(0)
    this.maxAbs = 0
    this.bounds = null
  }
}

/**
 * Waves travel a fixed number of cells per step. If you make the grid finer (more cells over the same real area), each cell is
 * smaller, so the same cells-per-step would mean slower waves on screen. To keep the wave speed the same in the real world,
 * the stiffness has to grow with the SQUARE of how many times finer the grid is (wave speed is the square root of stiffness).
 * Returns the new stiffness (capped, because above 0.45 the maths blows up) and `scale`, the factor to multiply any bump
 * radius (measured in cells) by so a bump keeps the same real-world size.
 */
export function rescaleForGrid(baseCells: number, cells: number, baseStiffness: number): { stiffness: number; scale: number } {
  const scale = cells / baseCells
  return { stiffness: Math.min(baseStiffness * scale * scale, 0.45), scale }
}

/**
 * Settings for the cursor water on one screen-pixel grid. `cell` is the width of one water cell in screen pixels.
 * A wave front should cross the screen at the same speed (about 268 pixels a second) whatever the grid, so the stiffness is
 * chosen from the cell size and the number of simulation steps per tick: speed = sqrt(stiffness) x steps x cell x 60.
 */
/**
 * How hard the cursor presses into the water at a given speed (in screen pixels a second): a slow cursor makes a faint wake, a fast
 * one a stronger wake, up to a limit. Negative, because the cursor pushes the surface DOWN. `strength` scales it (1 = the lively original).
 */
export function cursorStrokeAmount(pxPerSecond: number, strength = 1): number {
  return -Math.min(0.38, 0.04 + pxPerSecond / 3200) * strength
}

export function cursorWater(cell: number): { substeps: number; stiffness: number } {
  const substeps = cell >= 7 ? 1 : 2 // very fine cells would need a stiffness too high to be stable, so they take two smaller steps instead
  return { substeps, stiffness: Math.min(0.2 * (10 / (substeps * cell)) ** 2, 0.45) }
}
