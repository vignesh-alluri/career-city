import { toHalfFloat } from '@/lib/halfFloat'
import type { Bounds, WaterSim } from '@/lib/waterSim'

/** Something the cursor water can be drawn onto. One version uses the graphics card (smooth), one uses a plain 2D canvas (fallback). */
export interface WaterSurface {
  kind: 'gl' | '2d'
  /** Called whenever the grid changes size (the window was resized, or the water switched to bigger cells). */
  resize(cols: number, rows: number, cell: number): void
  draw(sim: WaterSim, cell: number, maxAlpha: number): void
  clear(): void
  dispose(): void
}

const VERTEX = `#version 300 es
out vec2 vUv;
void main() {
  // one big triangle that covers the whole screen, made from the vertex number (no vertex data needed)
  vec2 p = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2));
  vUv = vec2(p.x, 1.0 - p.y);
  gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
}`

const FRAGMENT = `#version 300 es
precision highp float;
precision highp sampler2D;   // samplers default to LOW precision in GLSL ES 3.00, which can crush small water heights on phones
uniform sampler2D uHeight;
uniform vec2 uTexel;     // one water cell, in texture coordinates
uniform vec2 uScale;     // the grid is a little bigger than the screen; this maps the screen onto it
uniform float uGlint;
uniform float uShade;
uniform float uMaxAlpha; // the brightest the ripples may be drawn: this is the "strength" setting
in vec2 vUv;
out vec4 outColor;
void main() {
  vec2 uv = vUv * uScale;
  // The slope of the water is the height difference between neighbours. The graphics card blends between water cells, so this
  // is smooth at every screen pixel instead of one flat value per cell: that is what removes the blocky look.
  float hl = texture(uHeight, uv - vec2(uTexel.x, 0.0)).r;
  float hr = texture(uHeight, uv + vec2(uTexel.x, 0.0)).r;
  float hd = texture(uHeight, uv - vec2(0.0, uTexel.y)).r;
  float hu = texture(uHeight, uv + vec2(0.0, uTexel.y)).r;
  vec2 g = vec2(hr - hl, hu - hd) * 0.5;
  if (dot(g, g) < 4e-6) discard;                       // flat water: nothing to draw
  float lit = dot(g, vec2(-0.55, -0.83));              // how much this bit of water faces the light
  float glint = pow(clamp(lit * uGlint, 0.0, 1.0), 1.5);
  float shade = clamp(-lit * uShade, 0.0, 1.0);
  float a = min(uMaxAlpha, glint * 0.8 + shade * 0.25); // capped, so text under a fast stroke stays readable
  if (a < 0.01) discard;
  vec3 col = glint >= shade ? vec3(205.0, 236.0, 255.0) / 255.0 : vec3(90.0, 105.0, 235.0) / 255.0;
  outColor = vec4(col * a, a);                         // premultiplied alpha, which is what a canvas expects
}`

function compile(gl: WebGL2RenderingContext, type: number, source: string): WebGLShader | null {
  const shader = gl.createShader(type)
  if (!shader) return null
  gl.shaderSource(shader, source)
  gl.compileShader(shader)
  if (gl.getShaderParameter(shader, gl.COMPILE_STATUS)) return shader
  gl.deleteShader(shader)
  return null
}

function buildProgram(gl: WebGL2RenderingContext): WebGLProgram | null {
  const vs = compile(gl, gl.VERTEX_SHADER, VERTEX), fs = compile(gl, gl.FRAGMENT_SHADER, FRAGMENT)
  if (!vs || !fs) return null
  const program = gl.createProgram()
  if (!program) return null
  gl.attachShader(program, vs)
  gl.attachShader(program, fs)
  gl.linkProgram(program)
  gl.deleteShader(vs)
  gl.deleteShader(fs)
  if (gl.getProgramParameter(program, gl.LINK_STATUS)) return program
  gl.deleteProgram(program)
  return null
}

/** The smallest rectangle holding both (either may be missing), grown by `by` cells and kept inside a cols x rows grid. */
export function mergeBounds(a: Bounds | null, b: Bounds | null, by: number, cols: number, rows: number): Bounds | null {
  if (!a && !b) return null
  const x0 = Math.min(a?.x0 ?? Infinity, b?.x0 ?? Infinity), y0 = Math.min(a?.y0 ?? Infinity, b?.y0 ?? Infinity)
  const x1 = Math.max(a?.x1 ?? -Infinity, b?.x1 ?? -Infinity), y1 = Math.max(a?.y1 ?? -Infinity, b?.y1 ?? -Infinity)
  return { x0: Math.max(0, x0 - by), y0: Math.max(0, y0 - by), x1: Math.min(cols - 1, x1 + by), y1: Math.min(rows - 1, y1 + by) }
}

let probed: boolean | null = null
/**
 * Can this browser run the smooth version? Tested once, on a throwaway canvas, by compiling the real shaders. A canvas can only
 * ever have one kind of drawing context, so we must know BEFORE we touch the real one.
 */
export function glWaterSupported(): boolean {
  if (probed !== null) return probed
  try {
    const gl = document.createElement('canvas').getContext('webgl2')
    probed = !!gl && !!buildProgram(gl) && !!gl.getParameter(gl.MAX_TEXTURE_SIZE)
    gl?.getExtension('WEBGL_lose_context')?.loseContext()
  } catch { probed = false }
  return probed
}

export function createGlSurface(el: HTMLCanvasElement): WaterSurface | null {
  const gl = el.getContext('webgl2', { alpha: true, premultipliedAlpha: true, antialias: false, depth: false, stencil: false, powerPreference: 'low-power' })
  if (!gl) return null
  const program = buildProgram(gl)
  const texture = gl.createTexture()
  if (!program || !texture) return null

  gl.useProgram(program)
  gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1) // rows of 16-bit numbers are not always a multiple of 4 bytes wide
  const u = (name: string) => gl.getUniformLocation(program, name)
  const uTexel = u('uTexel'), uScale = u('uScale'), uGlint = u('uGlint'), uShade = u('uShade'), uMaxAlpha = u('uMaxAlpha')
  gl.uniform1i(u('uHeight'), 0)
  gl.activeTexture(gl.TEXTURE0)
  gl.bindTexture(gl.TEXTURE_2D, texture)
  for (const [name, value] of [[gl.TEXTURE_MIN_FILTER, gl.LINEAR], [gl.TEXTURE_MAG_FILTER, gl.LINEAR], [gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE], [gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE]]) gl.texParameteri(gl.TEXTURE_2D, name, value)

  let cols = 0
  let rows = 0
  let scratch = new Uint16Array(0)
  let previous: Bounds | null = null // where the water was moving at the last draw
  let dirty: Bounds | null = null    // everything sent to the graphics card since it was last wiped
  return {
    kind: 'gl',
    resize(c, r, cell) {
      cols = c; rows = r
      previous = null; dirty = null
      gl.bindTexture(gl.TEXTURE_2D, texture)
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.R16F, c, r, 0, gl.RED, gl.HALF_FLOAT, new Uint16Array(c * r))
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5)
      el.width = Math.max(1, Math.round(window.innerWidth * dpr))
      el.height = Math.max(1, Math.round(window.innerHeight * dpr))
      gl.viewport(0, 0, el.width, el.height)
      gl.uniform2f(uTexel, 1 / c, 1 / r)
      gl.uniform2f(uScale, window.innerWidth / (c * cell), window.innerHeight / (r * cell))
    },
    draw(sim, cell, maxAlpha) {
      // Only the part of the water that moved needs sending: where it is moving now, plus where it was moving a moment ago (so the
      // cells it just left get their final, almost-flat values). Two extra cells all round, for the neighbours the shader reads.
      const current = sim.activeBounds
      const region = mergeBounds(previous, current, 2, cols, rows)
      if (region) {
        const w = region.x1 - region.x0 + 1, hgt = region.y1 - region.y0 + 1
        if (scratch.length < w * hgt) scratch = new Uint16Array(w * hgt)
        const h = sim.height
        let n = 0
        for (let y = region.y0; y <= region.y1; y++) {
          for (let k = y * cols + region.x0, end = y * cols + region.x1; k <= end; k++) { const v = h[k]; scratch[n++] = toHalfFloat(v < -2 ? -2 : v > 2 ? 2 : v) }
        }
        gl.bindTexture(gl.TEXTURE_2D, texture)
        gl.texSubImage2D(gl.TEXTURE_2D, 0, region.x0, region.y0, w, hgt, gl.RED, gl.HALF_FLOAT, scratch.subarray(0, w * hgt))
        dirty = mergeBounds(dirty, region, 0, cols, rows)
      }
      previous = current
      gl.uniform1f(uGlint, 64 / cell)
      gl.uniform1f(uShade, 48 / cell)
      gl.uniform1f(uMaxAlpha, maxAlpha)
      gl.clearColor(0, 0, 0, 0)
      gl.clear(gl.COLOR_BUFFER_BIT)
      gl.drawArrays(gl.TRIANGLES, 0, 3)
    },
    clear() {
      // wipe the picture AND the heights that were sent, or the next ripple would start on top of leftovers
      if (dirty) {
        const w = dirty.x1 - dirty.x0 + 1, hgt = dirty.y1 - dirty.y0 + 1
        gl.bindTexture(gl.TEXTURE_2D, texture)
        gl.texSubImage2D(gl.TEXTURE_2D, 0, dirty.x0, dirty.y0, w, hgt, gl.RED, gl.HALF_FLOAT, new Uint16Array(w * hgt))
      }
      dirty = null; previous = null
      gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT)
    },
    dispose() {
      // Free what we made, but do NOT shut the context down: in development React runs every effect twice on the same canvas,
      // and the second run needs a working context. The browser frees the context itself when the canvas goes away.
      gl.deleteTexture(texture)
      gl.deleteProgram(program)
    },
  }
}

/** The fallback: the same picture worked out on the CPU, one flat colour per water cell, blown up by the browser. */
export function create2dSurface(el: HTMLCanvasElement): WaterSurface | null {
  const ctx = el.getContext('2d')
  if (!ctx) return null
  let image: ImageData
  let previous: Bounds | null = null
  return {
    kind: '2d',
    resize(c, r) { el.width = c; el.height = r; image = ctx.createImageData(c, r); previous = null },
    draw(sim, cell, maxAlpha) {
      const glintGain = 64 / cell, shadeGain = 48 / cell
      const { cols, rows, height: h } = sim
      const current = sim.activeBounds
      const region = mergeBounds(previous, current, 2, cols, rows)
      previous = current
      if (!region) return
      const px = image.data
      const x0 = Math.max(1, region.x0), x1 = Math.min(cols - 2, region.x1), y0 = Math.max(1, region.y0), y1 = Math.min(rows - 2, region.y1)
      for (let y = y0; y <= y1; y++) {
        for (let x = x0; x <= x1; x++) {
          const k = y * cols + x
          const o = k * 4
          const gx = (h[k + 1] - h[k - 1]) * 0.5, gy = (h[k + cols] - h[k - cols]) * 0.5
          px[o + 3] = 0
          if (gx * gx + gy * gy < 4e-6) continue
          const lit = gx * -0.55 + gy * -0.83
          const glint = Math.min(1, Math.max(0, lit * glintGain)) ** 1.5
          const shade = Math.min(1, Math.max(0, -lit * shadeGain))
          const a = Math.min(maxAlpha, glint * 0.8 + shade * 0.25)
          if (a < 0.01) continue
          if (glint >= shade) { px[o] = 205; px[o + 1] = 236; px[o + 2] = 255 } else { px[o] = 90; px[o + 1] = 105; px[o + 2] = 235 }
          px[o + 3] = a * 255
        }
      }
      ctx.putImageData(image, 0, 0, x0, y0, x1 - x0 + 1, y1 - y0 + 1) // only the changed rectangle
    },
    clear() { ctx.clearRect(0, 0, el.width, el.height); image?.data.fill(0); previous = null },
    dispose() { /* nothing to free */ },
  }
}
