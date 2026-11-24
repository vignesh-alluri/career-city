import { useMemo } from 'react'
import * as THREE from 'three'

/**
 * A big inside-out sphere painted with a vertical gradient: deep blue overhead, a lighter blue haze at the horizon,
 * like the rainy-dusk sky in the reference. Vertex colours do the gradient, so there is no texture to load.
 */
export function SkyDome() {
  const geometry = useMemo(() => {
    const R = 120 // must stay inside the camera's far plane (200) from every camera position
    const g = new THREE.SphereGeometry(R, 24, 16)
    const pos = g.attributes.position
    const colors = new Float32Array(pos.count * 3)
    const top = new THREE.Color('#071337')
    const horizon = new THREE.Color('#2F7FC8')
    const c = new THREE.Color()
    for (let i = 0; i < pos.count; i++) {
      const t = Math.abs(pos.getY(i)) / R // 0 at the horizon, 1 straight up or down
      c.copy(horizon).lerp(top, Math.min(1, t * 1.6))
      colors.set([c.r, c.g, c.b], i * 3)
    }
    g.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    return g
  }, [])

  return (
    <mesh geometry={geometry} renderOrder={-1} raycast={() => null}>
      <meshBasicMaterial vertexColors side={THREE.BackSide} fog={false} depthWrite={false} toneMapped={false} />
    </mesh>
  )
}
