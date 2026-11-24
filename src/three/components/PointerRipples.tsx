import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { WaterSim, rescaleForGrid } from '@/lib/waterSim'
import { GROUND_RADIUS } from '../config/layout'

const SURFACE_Y = 0.26             // just above the district platforms and the plaza, so the water shows on them as well as on the ground
const STEP = 1 / 60                // the water is simulated 60 times a second, whatever the screen's frame rate
const SIDE = GROUND_RADIUS * 2     // the simulated square covers the whole ground, in world units
const BASE_CELLS = 160            // the grid the water was first tuned on; finer grids are rescaled to behave the same
const BASE_STIFFNESS = 0.1

const VERTEX = /* glsl */ `
  varying vec2 vPos;
  void main() {
    vec4 world = modelMatrix * vec4(position, 1.0);
    vPos = world.xz;                       // where on the ground this pixel is
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`

/**
 * Reads the water height from the simulation and lights the surface like glass. For each pixel we look at the heights just
 * left, right, above and below to get the SLOPE of the water there. Slopes that face the light get a bright glint, slopes facing
 * away get a darker blue shade, and anywhere the water is moving gets a faint sheen. Calm water draws nothing at all.
 */
const FRAGMENT = /* glsl */ `
  uniform sampler2D uHeight;
  uniform float uTexel;        // size of one cell in texture coordinates
  uniform float uRadius;       // radius of the ground in world units
  uniform float uGain;         // a finer grid has gentler slopes per cell, so the slope is multiplied back up
  varying vec2 vPos;

  void main() {
    if (length(vPos) > uRadius) discard;
    vec2 uv = vPos / (2.0 * uRadius) + 0.5;
    float hl = texture2D(uHeight, uv - vec2(uTexel, 0.0)).r;
    float hr = texture2D(uHeight, uv + vec2(uTexel, 0.0)).r;
    float hd = texture2D(uHeight, uv - vec2(0.0, uTexel)).r;
    float hu = texture2D(uHeight, uv + vec2(0.0, uTexel)).r;
    vec2 grad = vec2(hr - hl, hu - hd) * 0.5 * uGain;          // how steep the water is, per cell
    vec2 lightDir = normalize(vec2(-0.55, -0.83));
    float lit = dot(grad, lightDir);
    float glint = pow(clamp(lit * 9.0, 0.0, 1.0), 1.5);   // bright on slopes that face the light
    float shade = clamp(-lit * 7.0, 0.0, 1.0);            // darker on slopes that face away
    float sheen = clamp(length(grad) * 5.0, 0.0, 1.0);    // a faint shimmer wherever the water is moving
    vec3 cool = vec3(0.72, 0.93, 1.0);
    vec3 deep = vec3(0.25, 0.42, 1.0);
    vec3 col = cool * (glint + sheen * 0.25) + deep * shade * 0.7;
    float a = clamp(glint * 0.95 + shade * 0.5 + sheen * 0.22, 0.0, 0.9);
    if (a < 0.004) discard;
    gl_FragColor = vec4(col, a);
  }
`

const toCell = (world: number, cells: number) => (world / SIDE + 0.5) * cells

/**
 * The wet ground is a real patch of water. Move the cursor over the city and it drags a finger through the water, leaving a wake
 * that spreads out behind it. Click to drop a stone. With `rain` on (the My city page), rain also falls on it, making small rings.
 * On the landing page `rain` is off, so the only thing that ever moves the water is you.
 *
 * The wake is found every frame by projecting the cursor onto the ground, not from hover events. Two reasons: a district's own hover
 * handler stops the event before it reaches the ground, which used to kill the wake over buildings, and with events the wake
 * could not follow the cursor while the page scrolled and the camera moved under a still mouse.
 * The surface is calculated on the CPU (see lib/waterSim.ts), sent to the graphics card as a texture, and drawn by the shader above.
 */
export function PointerRipples({ enabled, cells, rain }: { enabled: boolean; cells: number; rain: boolean }) {
  // `cells` is the width of the water grid. Finer water means smaller, crisper ripples, but the cost grows with the square.
  const rainPerSecond = rain ? (cells >= 256 ? 10 : 4) : 0
  const { stiffness, scale } = useMemo(() => rescaleForGrid(BASE_CELLS, cells, BASE_STIFFNESS), [cells])
  const sim = useMemo(() => new WaterSim(cells, cells, { stiffness, damping: 0.994 }), [cells, stiffness])
  const data = useMemo(() => new Uint16Array(cells * cells * 4), [cells]) // half-float pixels; only the red channel (the height) is used
  const texture = useMemo(() => {
    const t = new THREE.DataTexture(data, cells, cells, THREE.RGBAFormat, THREE.HalfFloatType)
    t.minFilter = THREE.LinearFilter
    t.magFilter = THREE.LinearFilter
    t.generateMipmaps = false
    t.needsUpdate = true
    return t
  }, [data, cells])
  useEffect(() => () => texture.dispose(), [texture])

  const uniforms = useMemo(() => ({ uHeight: { value: texture }, uTexel: { value: 1 / cells }, uRadius: { value: GROUND_RADIUS }, uGain: { value: scale } }), [texture, cells, scale])
  const surface = useRef<THREE.Mesh>(null)
  const state = useRef({ accumulator: 0, rainBank: 0, lastX: 0, lastZ: 0, lastTime: 0, hasLast: false })

  // Is the cursor over the 3D picture right now? (Not over a panel that sits on top of it.)
  const canvasElement = useThree((s) => s.gl.domElement)
  const inside = useRef(false)
  useEffect(() => {
    const enter = () => { inside.current = true }
    const leave = () => { inside.current = false; state.current.hasLast = false }
    canvasElement.addEventListener('pointermove', enter, { passive: true })
    canvasElement.addEventListener('pointerleave', leave)
    return () => { canvasElement.removeEventListener('pointermove', enter); canvasElement.removeEventListener('pointerleave', leave); inside.current = false }
  }, [canvasElement])
  const raycaster = useMemo(() => new THREE.Raycaster(), [])
  const plane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 1, 0), -SURFACE_Y), [])
  const hit = useMemo(() => new THREE.Vector3(), [])

  useFrame(({ camera, pointer }, delta) => {
    const s = state.current

    // The wake: where does a line from the camera through the cursor meet the water?
    if (enabled && inside.current) {
      raycaster.setFromCamera(pointer, camera)
      if (raycaster.ray.intersectPlane(plane, hit) && Math.hypot(hit.x, hit.z) < GROUND_RADIUS) {
        const now = performance.now() / 1000
        if (!s.hasLast || Math.hypot(hit.x - s.lastX, hit.z - s.lastZ) > 0.02) { // only when that point has actually moved
          const x = toCell(hit.x, cells), y = toCell(hit.z, cells)
          if (s.hasLast && now - s.lastTime < 0.25) {
            const worldSpeed = Math.hypot(hit.x - s.lastX, hit.z - s.lastZ) / Math.max(now - s.lastTime, 0.001) // faster cursor, bigger wake
            sim.stroke(toCell(s.lastX, cells), toCell(s.lastZ, cells), x, y, 1.5 * scale, -Math.min(0.65, 0.1 + worldSpeed * 0.018))
          } else {
            sim.disturb(x, y, 1.5 * scale, -0.12)
          }
          s.lastX = hit.x; s.lastZ = hit.z; s.lastTime = now; s.hasLast = true
        }
      }
    }
    s.accumulator += Math.min(delta, 0.05) // a long pause (switching tabs) must not fast-forward the water
    let steps = 0
    while (s.accumulator >= STEP && steps < 3) {
      s.rainBank += rainPerSecond * STEP
      while (s.rainBank >= 1) {
        s.rainBank -= 1
        const r = (GROUND_RADIUS - 2) * Math.sqrt(Math.random()), a = Math.random() * Math.PI * 2
        sim.disturb(toCell(Math.cos(a) * r, cells), toCell(Math.sin(a) * r, cells), 1.1 * scale, -(0.07 + Math.random() * 0.09))
      }
      sim.step()
      s.accumulator -= STEP
      steps++
    }
    if (steps === 0) return
    const h = sim.height
    for (let k = 0; k < h.length; k++) data[k * 4] = THREE.DataUtils.toHalfFloat(Math.max(-2, Math.min(2, h[k])))
    texture.needsUpdate = true
    if (surface.current) surface.current.visible = sim.maxAbs > 0.003 // calm water draws nothing at all
  })

  if (!enabled) return null
  return (
    <group>
      {/* invisible, but it still receives clicks (the stone) */}
      <mesh
        rotation-x={-Math.PI / 2} position-y={SURFACE_Y}
        onPointerDown={(e) => sim.disturb(toCell(e.point.x, cells), toCell(e.point.z, cells), 2.4 * scale, -1.2)}
      >
        <circleGeometry args={[GROUND_RADIUS, 48]} />
        <meshBasicMaterial visible={false} />
      </mesh>
      <mesh ref={surface} rotation-x={-Math.PI / 2} position-y={SURFACE_Y} visible={false} raycast={() => null}>
        <circleGeometry args={[GROUND_RADIUS, 64]} />
        <shaderMaterial vertexShader={VERTEX} fragmentShader={FRAGMENT} uniforms={uniforms} transparent depthWrite={false} />
      </mesh>
    </group>
  )
}
