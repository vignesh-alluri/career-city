import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { useReducedMotion } from '@/hooks/useMediaQuery'
import { WATER_STRENGTH_FACTOR } from '@/lib/preferences'
import { cursorStrokeAmount, cursorWater, WaterSim } from '@/lib/waterSim'
import { usePreferences } from '@/store/preferencesStore'
import { createGlSurface, create2dSurface, glWaterSupported, type WaterSurface } from './waterSurface'
import { setWaterStatus } from './waterStatus'

// Cell size = how many screen pixels one water cell covers. Ripples cannot be thinner than a couple of cells, so SMALLER IS FINER.
// The simulation only works where the water is moving (see WaterSim), so fine cells are affordable. Each list is a ladder: it starts
// at the finest and steps down one rung if frames are too slow. The fallback canvas version is blocky by nature, so it needs fine cells.
const LADDER = { gl: [4, 6, 8], '2d': [5, 10] } as const
const BUDGET_MS = { gl: 4, '2d': 6 } as const   // if a busy frame costs more than this (on average), step down one rung
const STEP = 1 / 60
const IDLE = 0.003                              // below this the water counts as calm and nothing is drawn
const SETTLE_FRAMES = 30                        // ...but only after this many busy frames, so one slow frame cannot trigger it

/** Remembered for the whole visit, so going to another page and back does not make the water fine (and slow) again. */
let rung = 0

/**
 * The cursor moves through the workspace like a finger through water: it leaves a glassy wake that spreads out and fades,
 * and a click drops a stone. The waves are the same simulation as the 3D city's (lib/waterSim.ts), kept small, and then drawn by
 * the graphics card (waterSurface.ts), which works out the lighting at every screen pixel. That is what keeps the ripples smooth
 * instead of blocky. Browsers without WebGL 2 get the older, blockier canvas drawing.
 *
 * Performance rules (this effect runs on top of everything else):
 *  - It does no work while the water is calm, and the canvas is hidden then, so the browser has nothing extra to composite.
 *  - It measures itself. If a busy frame costs too much it steps down to bigger cells (4, then 6, then 8 pixels).
 *  - It is off on the My city page, which already has its own 3D water.
 * Also off for visitors who prefer reduced motion, and by a switch in Settings.
 */
export function WaterCursor() {
  const enabled = usePreferences((s) => s.waterCursor)
  const strength = usePreferences((s) => WATER_STRENGTH_FACTOR[s.waterStrength])
  const strengthRef = useRef(strength) // read inside the animation loop, so changing it does not restart the water
  useEffect(() => { strengthRef.current = strength }, [strength])
  const reducedMotion = useReducedMotion()
  const onCityPage = useLocation().pathname.startsWith('/app/city')
  const active = enabled && !reducedMotion && !onCityPage
  const canvas = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const el = canvas.current
    if (!active || !el) return
    const surface: WaterSurface | null = (glWaterSupported() ? createGlSurface(el) : null) ?? create2dSurface(el)
    if (!surface) return

    const ladder = LADDER[surface.kind]
    let cell: number = ladder[Math.min(rung, ladder.length - 1)]
    setWaterStatus({ kind: surface.kind, cell, steppedDown: rung > 0 })
    let sim: WaterSim
    const setup = () => {
      const cols = Math.max(24, Math.ceil(window.innerWidth / cell)), rows = Math.max(24, Math.ceil(window.innerHeight / cell))
      const { stiffness } = cursorWater(cell)
      sim = new WaterSim(cols, rows, { stiffness, damping: 0.993 }) // a little more loss than before: ripples fade sooner
      surface.resize(cols, rows, cell)
    }
    setup()

    let last: { x: number; y: number; t: number } | null = null
    const onMove = (e: PointerEvent) => {
      const now = performance.now() / 1000
      const x = e.clientX / cell, y = e.clientY / cell
      if (last && now - last.t < 0.25) {
        const pxPerSecond = (Math.hypot(x - last.x, y - last.y) * cell) / Math.max(now - last.t, 0.001)
        sim.stroke(last.x, last.y, x, y, 16 / cell, cursorStrokeAmount(pxPerSecond, strengthRef.current))
      }
      last = { x, y, t: now }
    }
    const onDown = (e: PointerEvent) => sim.disturb(e.clientX / cell, e.clientY / cell, 26 / cell, -1.1 * strengthRef.current)
    const onLeave = () => { last = null }

    let frame = 0, previous = performance.now(), accumulator = 0, drawn = false
    let busyFrames = 0, averageMs = 0
    const tick = (nowMs: number) => {
      frame = requestAnimationFrame(tick)
      accumulator += Math.min((nowMs - previous) / 1000, 0.05)
      previous = nowMs
      if (sim.maxAbs < IDLE) {
        // calm: draw nothing, wipe the last picture once and hide the canvas
        if (drawn) { surface.clear(); el.style.visibility = 'hidden'; drawn = false }
        accumulator = 0
        return
      }
      const started = performance.now()
      const { substeps } = cursorWater(cell)
      let steps = 0
      while (accumulator >= STEP && steps < 3) { for (let i = 0; i < substeps; i++) sim.step(); accumulator -= STEP; steps++ }
      if (steps === 0) return
      surface.draw(sim, cell, 0.34 * strengthRef.current) // 0.34 was the brightest ripple of the original, lively version
      if (!drawn) el.style.visibility = 'visible'
      drawn = true

      // Self-check: a moving average of what a busy frame costs. Too slow? Use the bigger cells from now on.
      busyFrames++
      const cost = performance.now() - started
      averageMs = averageMs === 0 ? cost : averageMs * 0.9 + cost * 0.1
      if (rung < ladder.length - 1 && busyFrames >= SETTLE_FRAMES && averageMs > BUDGET_MS[surface.kind]) {
        rung++
        cell = ladder[rung]
        setWaterStatus({ kind: surface.kind, cell, steppedDown: true })
        setup()
        last = null; drawn = false; busyFrames = 0; averageMs = 0
      }
    }
    frame = requestAnimationFrame(tick)

    window.addEventListener('pointermove', onMove, { passive: true })
    window.addEventListener('pointerdown', onDown, { passive: true })
    document.addEventListener('pointerleave', onLeave)
    window.addEventListener('resize', setup)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerdown', onDown)
      document.removeEventListener('pointerleave', onLeave)
      window.removeEventListener('resize', setup)
      surface.dispose()
      setWaterStatus({ kind: 'off', cell: 0, steppedDown: false })
    }
  }, [active])

  if (!active) return null
  return <canvas ref={canvas} aria-hidden style={{ visibility: 'hidden' }} className="pointer-events-none fixed inset-0 z-[60] h-full w-full" />
}
