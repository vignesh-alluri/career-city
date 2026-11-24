import { useMemo } from 'react'
import * as THREE from 'three'
import { DISTRICT_BY_ID } from '@/config/districts'
import { DISTRICT_LAYOUTS } from '../config/layout'

/** A soft round glow: bright in the middle, fading to nothing at the edge. */
function makeGlowTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = 128
  const ctx = canvas.getContext('2d')!
  const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64)
  g.addColorStop(0, 'rgba(255,255,255,1)')
  g.addColorStop(0.45, 'rgba(255,255,255,0.35)')
  g.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, 128, 128)
  return new THREE.CanvasTexture(canvas)
}

/**
 * Pools of coloured light spilled on the wet streets around each district and under the tower, like the
 * glowing puddles in the street photo. Added on top of the ground (additive blending), so they only ever brighten it.
 */
export function NeonPools() {
  const texture = useMemo(makeGlowTexture, [])
  const pools = useMemo(() => [
    ...DISTRICT_LAYOUTS.map((l) => ({ key: l.id, x: l.position[0], z: l.position[2], size: 15, color: DISTRICT_BY_ID[l.id].color, opacity: 0.5 })),
    { key: 'plaza', x: 0, z: 0, size: 12, color: '#FF7A2F', opacity: 0.45 },
  ], [])
  return (
    <group>
      {pools.map((p) => (
        <mesh key={p.key} rotation-x={-Math.PI / 2} position={[p.x, 0.09, p.z]} raycast={() => null}>
          <planeGeometry args={[p.size, p.size]} />
          <meshBasicMaterial map={texture} color={p.color} transparent opacity={p.opacity} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
        </mesh>
      ))}
    </group>
  )
}
