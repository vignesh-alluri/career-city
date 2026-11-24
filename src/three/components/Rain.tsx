import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const RADIUS = 32     // rain falls inside a cylinder this wide, centred on the city
const HEIGHT = 40
const WIND = 0.12     // sideways drift per unit of fall, so the rain slants like the streaks in the reference

/**
 * Rain: hundreds of short streaks drawn as ONE set of line segments. Every frame each streak moves down a little
 * and, when it hits the ground, jumps back to the top at a new random spot.
 * Nothing is drawn when the visitor prefers reduced motion, because falling rain is constant movement.
 */
export function Rain({ count, animate }: { count: number; animate: boolean }) {
  const lines = useRef<THREE.LineSegments>(null)

  // head = the lower end of a streak; the tail trails up and back along the wind direction
  const { geometry, heads, lengths, speeds } = useMemo(() => {
    const heads = new Float32Array(count * 3)
    const lengths = new Float32Array(count)
    const speeds = new Float32Array(count)
    const respawn = (i: number, anywhere: boolean) => {
      const r = RADIUS * Math.sqrt(Math.random())
      const a = Math.random() * Math.PI * 2
      heads[i * 3] = Math.cos(a) * r
      heads[i * 3 + 1] = anywhere ? Math.random() * HEIGHT : HEIGHT + Math.random() * 6
      heads[i * 3 + 2] = Math.sin(a) * r
    }
    for (let i = 0; i < count; i++) {
      respawn(i, true)
      lengths[i] = 0.9 + Math.random() * 0.9
      speeds[i] = 22 + Math.random() * 12
    }
    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(count * 6), 3))
    return { geometry, heads, lengths, speeds }
  }, [count])

  useFrame((_, delta) => {
    if (!animate || !lines.current) return
    const dt = Math.min(delta, 0.05) // a long pause (switching tabs) must not teleport the rain
    const pos = geometry.attributes.position as THREE.BufferAttribute
    for (let i = 0; i < count; i++) {
      const drop = speeds[i] * dt
      heads[i * 3 + 1] -= drop
      heads[i * 3] += drop * WIND
      if (heads[i * 3 + 1] < 0) {
        const r = RADIUS * Math.sqrt(Math.random())
        const a = Math.random() * Math.PI * 2
        heads[i * 3] = Math.cos(a) * r
        heads[i * 3 + 1] = HEIGHT + Math.random() * 6
        heads[i * 3 + 2] = Math.sin(a) * r
      }
      const x = heads[i * 3], y = heads[i * 3 + 1], z = heads[i * 3 + 2], len = lengths[i]
      pos.setXYZ(i * 2, x, y, z)
      pos.setXYZ(i * 2 + 1, x - WIND * len, y + len, z)
    }
    pos.needsUpdate = true
  })

  if (!animate) return null
  return (
    <lineSegments ref={lines} geometry={geometry} frustumCulled={false} raycast={() => null}>
      <lineBasicMaterial color="#A9C7FF" transparent opacity={0.5} depthWrite={false} fog={false} />
    </lineSegments>
  )
}
