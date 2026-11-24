import { describe, expect, it } from 'vitest'
import { WaterSim, cursorStrokeAmount, cursorWater, rescaleForGrid } from './waterSim'

const at = (sim: WaterSim, x: number, y: number) => sim.height[y * sim.cols + x]
const run = (sim: WaterSim, steps: number) => { for (let i = 0; i < steps; i++) sim.step() }

describe('WaterSim', () => {
  it('starts perfectly flat', () => {
    const sim = new WaterSim(48, 48)
    run(sim, 10)
    expect(sim.maxAbs).toBe(0)
  })

  it('spreads a bump outwards as a wave: far water is still, then the wave arrives', () => {
    const sim = new WaterSim(81, 81)
    sim.disturb(40, 40, 1.5, -1)
    run(sim, 8)
    expect(Math.abs(at(sim, 40 + 30, 40))).toBeLessThan(1e-6) // too far for the wave to have arrived yet
    run(sim, 70)
    let reach = 0
    for (let x = 41; x < 78; x++) if (Math.abs(at(sim, x, 40)) > 1e-3) reach = x - 40
    expect(reach).toBeGreaterThan(15) // by now the disturbance has travelled well away from the centre
  })

  it('the wave front keeps moving outwards', () => {
    const front = (steps: number) => {
      const sim = new WaterSim(121, 121)
      sim.disturb(60, 60, 1.5, -1)
      run(sim, steps)
      let r = 0
      for (let x = 61; x < 118; x++) if (Math.abs(at(sim, x, 60)) > 2e-3) r = x - 60
      return r
    }
    expect(front(60)).toBeGreaterThan(front(30))
  })

  it('is the same in every direction (a bump at the exact centre gives a symmetric wave)', () => {
    const sim = new WaterSim(65, 65)
    sim.disturb(32, 32, 1.5, -1)
    run(sim, 40)
    for (const k of [3, 7, 12]) {
      expect(at(sim, 32 + k, 32)).toBeCloseTo(at(sim, 32 - k, 32), 6)
      expect(at(sim, 32, 32 + k)).toBeCloseTo(at(sim, 32 + k, 32), 6)
    }
  })

  it('calms down by itself: ripples fade away', () => {
    const sim = new WaterSim(64, 64)
    sim.disturb(32, 32, 1.5, -1)
    run(sim, 900)
    expect(sim.maxAbs).toBeLessThan(0.01)
  })

  it('stays stable under constant random disturbance (no runaway growth)', () => {
    const sim = new WaterSim(64, 64)
    let seed = 1
    const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647)
    for (let i = 0; i < 3000; i++) {
      sim.disturb(rand() * 64, rand() * 64, 1.2, -0.4)
      sim.step()
    }
    expect(sim.maxAbs).toBeLessThan(6)
    expect(Number.isFinite(sim.maxAbs)).toBe(true)
  })

  it('soaks waves up at the border instead of bouncing them back', () => {
    const sim = new WaterSim(48, 48)
    sim.disturb(24, 24, 1.5, -1)
    run(sim, 60)
    const early = sim.maxAbs
    run(sim, 160) // by now the wave has hit the edge and should be mostly gone, not bouncing around the pool
    expect(sim.maxAbs).toBeLessThan(early * 0.5)
  })

  it('a stroke leaves a continuous dip along the whole line', () => {
    const sim = new WaterSim(64, 64)
    sim.stroke(10, 32, 50, 32, 1.5, -1)
    for (let x = 12; x <= 48; x += 4) expect(at(sim, x, 32)).toBeLessThan(-0.3)
    expect(at(sim, 30, 50)).toBeGreaterThan(-0.01) // far from the line stays still
  })

  it('reset makes it flat again', () => {
    const sim = new WaterSim(32, 32)
    sim.disturb(16, 16, 2, -1)
    run(sim, 5)
    sim.reset()
    expect(sim.maxAbs).toBe(0)
    expect(Math.max(...sim.height)).toBe(0)
  })
})

describe('rescaleForGrid', () => {
  it('leaves the base grid unchanged', () => {
    expect(rescaleForGrid(160, 160, 0.1)).toEqual({ stiffness: 0.1, scale: 1 })
  })

  it('a finer grid keeps the same real-world wave speed', () => {
    // wave front position as a fraction of the grid width after the same number of steps
    const frontFraction = (cells: number) => {
      const { stiffness, scale } = rescaleForGrid(80, cells, 0.1)
      const sim = new WaterSim(cells, cells, { stiffness, damping: 1 })
      const mid = Math.floor(cells / 2)
      sim.disturb(mid, mid, 1.5 * scale, -1)
      run(sim, 40)
      let r = 0
      for (let x = mid + 1; x < cells - 2; x++) if (Math.abs(at(sim, x, mid)) > 0.02) r = x - mid
      return r / cells
    }
    expect(Math.abs(frontFraction(160) - frontFraction(80))).toBeLessThan(0.06)
  })
})

describe('cursorWater', () => {
  it('keeps the same on-screen wave speed for every cell size', () => {
    const speed = (cell: number) => { const { substeps, stiffness } = cursorWater(cell); return Math.sqrt(stiffness) * substeps * cell }
    for (const cell of [5, 8, 10, 12]) expect(speed(cell)).toBeCloseTo(Math.sqrt(0.2) * 10, 6)
  })

  it('uses two steps for very fine cells and one for the rest', () => {
    expect(cursorWater(5).substeps).toBe(2)
    expect(cursorWater(8).substeps).toBe(1)
    expect(cursorWater(12).substeps).toBe(1)
  })

  it('always stays inside the stable range of the simulation', () => {
    for (const cell of [3, 4, 5, 6, 7, 8, 10, 12, 16]) expect(cursorWater(cell).stiffness).toBeLessThanOrEqual(0.45)
  })
})

describe('WaterSim active area', () => {
  /** The plain version: every cell, every step. The reference the optimised simulation must agree with. */
  class Plain {
    h: Float32Array; v: Float32Array; damp: Float32Array
    constructor(readonly cols: number, readonly rows: number, readonly stiffness: number, damping: number) {
      this.h = new Float32Array(cols * rows); this.v = new Float32Array(cols * rows); this.damp = new Float32Array(cols * rows)
      const margin = Math.max(4, Math.round(Math.min(cols, rows) * 0.08))
      for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
        const edge = Math.min(x, cols - 1 - x, y, rows - 1 - y)
        this.damp[y * cols + x] = damping * (edge >= margin ? 1 : 0.84 + (0.16 * edge) / margin)
      }
    }
    disturb(x: number, y: number, radius: number, amount: number) {
      const reach = Math.ceil(radius * 3)
      for (let j = Math.max(1, Math.floor(y - reach)); j <= Math.min(this.rows - 2, Math.ceil(y + reach)); j++)
        for (let i = Math.max(1, Math.floor(x - reach)); i <= Math.min(this.cols - 2, Math.ceil(x + reach)); i++)
          this.h[j * this.cols + i] += amount * Math.exp(-((i - x) ** 2 + (j - y) ** 2) / (2 * radius * radius))
    }
    step() {
      const { cols, rows, h, v, damp, stiffness } = this
      for (let y = 1; y < rows - 1; y++) for (let x = 1; x < cols - 1; x++) {
        const k = y * cols + x
        v[k] = (v[k] + (h[k - 1] + h[k + 1] + h[k - cols] + h[k + cols] - 4 * h[k]) * stiffness) * damp[k]
      }
      for (let y = 1; y < rows - 1; y++) for (let x = 1; x < cols - 1; x++) h[y * cols + x] += v[y * cols + x]
    }
  }

  it('gives the same water as simulating every cell, even with stirring in different places', () => {
    const fast = new WaterSim(90, 70, { stiffness: 0.3, damping: 0.995 })
    const plain = new Plain(90, 70, 0.3, 0.995)
    const bumps: [number, number, number, number][] = [[20, 20, 2, -1], [70, 50, 1.5, -0.6], [45, 35, 3, -0.8]]
    for (let step = 0; step < 220; step++) {
      if (step % 40 === 0) { const [x, y, r, a] = bumps[(step / 40) % 3]; fast.disturb(x, y, r, a); plain.disturb(x, y, r, a) }
      fast.step(); plain.step()
    }
    let worst = 0
    for (let k = 0; k < plain.h.length; k++) worst = Math.max(worst, Math.abs(plain.h[k] - fast.height[k]))
    expect(worst).toBeLessThan(2e-3) // only cells below the "still" limit are left alone, so the difference is tiny
  })

  it('has no active area while the water is flat', () => {
    const sim = new WaterSim(40, 40)
    expect(sim.activeBounds).toBeNull()
    run(sim, 5)
    expect(sim.activeBounds).toBeNull()
  })

  it('a bump creates an active area around it, and it grows as the wave spreads', () => {
    const sim = new WaterSim(100, 100)
    sim.disturb(50, 50, 1.5, -1)
    const first = sim.activeBounds!
    expect(first.x0).toBeLessThanOrEqual(50)
    expect(first.x1).toBeGreaterThanOrEqual(50)
    run(sim, 20)
    const later = sim.activeBounds!
    expect(later.x1 - later.x0).toBeGreaterThan(first.x1 - first.x0)
  })

  it('never lets moving water escape the active area', () => {
    const sim = new WaterSim(100, 100, { stiffness: 0.3 })
    sim.disturb(30, 60, 2, -1)
    // Checked in a plain loop with ONE assertion at the end: thousands of expect() calls make a real test runner very slow.
    let escaped = 0
    for (let i = 0; i < 80; i++) {
      sim.step()
      const b = sim.activeBounds
      for (let y = 0; y < 100; y++) {
        for (let x = 0; x < 100; x++) {
          if (Math.abs(sim.height[y * 100 + x]) > 1e-3 && !(b !== null && x >= b.x0 && x <= b.x1 && y >= b.y0 && y <= b.y1)) escaped++
        }
      }
    }
    expect(escaped).toBe(0)
  })

  it('goes back to having no active area once the ripples have faded, and reset clears it', () => {
    const sim = new WaterSim(48, 48)
    sim.disturb(24, 24, 1.5, -0.5)
    run(sim, 2500)
    expect(sim.activeBounds).toBeNull()
    sim.disturb(10, 10, 1, -1)
    expect(sim.activeBounds).not.toBeNull()
    sim.reset()
    expect(sim.activeBounds).toBeNull()
  })

  it('does less work when the ripples are small: far cells are never touched', () => {
    const sim = new WaterSim(400, 400)
    sim.disturb(200, 200, 2, -1)
    run(sim, 10)
    const b = sim.activeBounds!
    expect((b.x1 - b.x0 + 1) * (b.y1 - b.y0 + 1)).toBeLessThan(400 * 400 * 0.05)
  })
})

describe('cursorWater for the finest cells', () => {
  it('keeps the same on-screen speed at 4 and 6 pixels too', () => {
    const speed = (cell: number) => { const { substeps, stiffness } = cursorWater(cell); return Math.sqrt(stiffness) * substeps * cell }
    for (const cell of [4, 6]) expect(speed(cell)).toBeCloseTo(Math.sqrt(0.2) * 10, 6)
  })
})

describe('cursorStrokeAmount', () => {
  it('pushes the surface down, harder for a faster cursor, up to a limit', () => {
    expect(cursorStrokeAmount(0)).toBeLessThan(0)
    expect(cursorStrokeAmount(800)).toBeLessThan(cursorStrokeAmount(200))
    expect(cursorStrokeAmount(1e6)).toBeCloseTo(-0.38, 6)
  })

  it('scales with the strength setting, and a gentler setting is always gentler', () => {
    expect(cursorStrokeAmount(500, 0.5)).toBeCloseTo(cursorStrokeAmount(500, 1) * 0.5, 9)
    expect(Math.abs(cursorStrokeAmount(500, 0.55))).toBeLessThan(Math.abs(cursorStrokeAmount(500, 0.8)))
  })
})
