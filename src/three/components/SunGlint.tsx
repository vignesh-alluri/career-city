import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { scrollState } from '@/animation/cameraRig'

const SUN_DISTANCE = 100
const GOLD = new THREE.Color('#FFB070')
const PINK = new THREE.Color('#FF7AB6')

function makeGlowTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = 128
  const ctx = canvas.getContext('2d')!
  const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64)
  g.addColorStop(0, 'rgba(255,255,255,1)')
  g.addColorStop(0.25, 'rgba(255,255,255,0.45)')
  g.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, 128, 128)
  return new THREE.CanvasTexture(canvas)
}

/** The sparkling band of light a low sun lays across wet ground: a soft glowing strip with short bright glints in it. */
function makeGlitterTexture(): THREE.CanvasTexture {
  const w = 64, h = 256
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')!
  const side = ctx.createLinearGradient(0, 0, w, 0)
  side.addColorStop(0, 'rgba(255,190,130,0)')
  side.addColorStop(0.5, 'rgba(255,190,130,0.5)')
  side.addColorStop(1, 'rgba(255,190,130,0)')
  ctx.fillStyle = side
  ctx.fillRect(0, 0, w, h)
  let seed = 7 // fixed sequence: the same sparkles on every load
  const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647)
  for (let i = 0; i < 170; i++) {
    ctx.fillStyle = `rgba(255,${225 + Math.floor(rand() * 30)},${170 + Math.floor(rand() * 60)},${0.45 + rand() * 0.55})`
    ctx.fillRect(w * 0.15 + rand() * w * 0.7, rand() * h, 1 + rand() * 2, 2 + rand() * 6)
  }
  const texture = new THREE.CanvasTexture(canvas)
  texture.wrapT = THREE.RepeatWrapping
  texture.repeat.set(1, 3)
  return texture
}

/** A fixed fade along the length of the strip, so it dissolves at both ends instead of stopping abruptly. */
function makeFadeTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = 4
  canvas.height = 128
  const ctx = canvas.getContext('2d')!
  const g = ctx.createLinearGradient(0, 0, 0, 128)
  g.addColorStop(0, '#000')
  g.addColorStop(0.5, '#fff')
  g.addColorStop(1, '#000')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, 4, 128)
  return new THREE.CanvasTexture(canvas)
}

/**
 * A low sun on the far side of the city, always opposite the camera, so the wet ground reflects it and a path of
 * golden glitter runs across the streets (like sunlight on water). It reacts to scrolling:
 *  - while the visitor scrolls it swings around the sky and flares brighter, then settles when they stop;
 *  - its colour drifts between gold and pink.
 * The sun itself is out of the camera's view (the camera looks down); you see its reflection, its light on the
 * buildings, and the glitter path.
 */
export function SunGlint({ tour, animate }: { tour: boolean; animate: boolean }) {
  const sun = useRef<THREE.Group>(null)
  const sunMat = useRef<THREE.MeshBasicMaterial>(null)
  const halo = useRef<THREE.Sprite>(null)
  const haloMat = useRef<THREE.SpriteMaterial>(null)
  const light = useRef<THREE.DirectionalLight>(null)
  const path = useRef<THREE.Group>(null)
  const pathMat = useRef<THREE.MeshBasicMaterial>(null)
  const glow = useMemo(makeGlowTexture, [])
  const glitter = useMemo(makeGlitterTexture, [])
  const fade = useMemo(makeFadeTexture, [])
  const color = useMemo(() => new THREE.Color(), [])
  const track = useRef({ last: 0, energy: 0 })

  useFrame(({ camera, clock }, delta) => {
    const dt = Math.min(delta, 0.05)
    // On the landing page the sun follows page scroll; on the My city page it drifts slowly by itself.
    const progress = tour ? scrollState.progress : (clock.elapsedTime * 0.03) % 1
    const speed = Math.abs(progress - track.current.last) / Math.max(dt, 1e-3)
    track.current.last = progress
    const idle = tour ? 0.15 : 0.35
    track.current.energy = THREE.MathUtils.damp(track.current.energy, animate ? Math.max(idle, Math.min(1, speed * 5)) : idle, 2.5, dt)
    const energy = track.current.energy

    const az = Math.atan2(camera.position.x, camera.position.z) + Math.PI + Math.sin(progress * Math.PI * 3) * 0.45
    const elev = 0.42 + 0.1 * Math.sin(progress * Math.PI * 2 + 1)
    const x = Math.sin(az) * Math.cos(elev) * SUN_DISTANCE
    const y = Math.sin(elev) * SUN_DISTANCE
    const z = Math.cos(az) * Math.cos(elev) * SUN_DISTANCE
    color.copy(GOLD).lerp(PINK, 0.5 + 0.5 * Math.sin(progress * Math.PI * 2))

    sun.current?.position.set(x, y, z)
    sunMat.current?.color.copy(color)
    haloMat.current?.color.copy(color)
    halo.current?.scale.setScalar(55 + 45 * energy)
    if (light.current) {
      light.current.position.set(x, y, z)
      light.current.color.copy(color)
      light.current.intensity = 0.5 + 2.4 * energy
    }
    if (path.current) path.current.rotation.y = az
    if (pathMat.current) pathMat.current.opacity = 0.2 + 0.6 * energy
    if (animate) glitter.offset.y = (glitter.offset.y + dt * (0.05 + 0.5 * energy)) % 1
  })

  return (
    <group>
      <directionalLight ref={light} intensity={0.5} />
      <group ref={sun}>
        <mesh raycast={() => null}>
          <sphereGeometry args={[7, 24, 16]} />
          <meshBasicMaterial ref={sunMat} toneMapped={false} fog={false} />
        </mesh>
        <sprite ref={halo} raycast={() => null}>
          <spriteMaterial ref={haloMat} map={glow} transparent blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} fog={false} />
        </sprite>
      </group>
      {/* the glitter path on the ground, pointing from the middle of the city towards the sun */}
      <group ref={path}>
        <mesh rotation-x={-Math.PI / 2} position={[0, 0.095, 6]} raycast={() => null}>
          <planeGeometry args={[5, 34]} />
          <meshBasicMaterial
            ref={pathMat} map={glitter} alphaMap={fade} transparent opacity={0.3}
            blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false}
          />
        </mesh>
      </group>
    </group>
  )
}
