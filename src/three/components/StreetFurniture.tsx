import { useMemo } from 'react'
import * as THREE from 'three'
import type { CityQuality } from '@/types'
import { DISTRICT_LAYOUTS, DISTRICT_RADIUS, RING_RADIUS } from '../config/layout'
import { COLORS } from '../config/palette'
import { InstancedBoxes, type BoxItem } from './InstancedBoxes'

const POLE_H = 1.7
const ARM = 0.27 // half the length of a pole's cross-arm

/**
 * Japanese street details from the rainy-street reference: wooden utility poles with cross-arms, wires sagging between
 * them, and a red paper lantern hanging from each pole. Poles stand beside the ring road, between the districts.
 */
export function StreetFurniture({ quality }: { quality: CityQuality }) {
  const { poles, arms, lanterns, wires } = useMemo(() => {
    const n = quality === 'high' ? 30 : 20
    const radius = RING_RADIUS + 1.15
    const spots = Array.from({ length: n }, (_, i) => {
      const a = (i / n) * Math.PI * 2
      const x = Math.sin(a) * radius, z = Math.cos(a) * radius
      const insideDistrict = DISTRICT_LAYOUTS.some((l) => Math.hypot(l.position[0] - x, l.position[2] - z) < DISTRICT_RADIUS + 0.9)
      return insideDistrict ? null : { a, x, z, tx: Math.cos(a), tz: -Math.sin(a) } // (tx, tz) = direction along the road
    })

    const poles: BoxItem[] = [], arms: BoxItem[] = [], lanterns: BoxItem[] = []
    for (const s of spots) {
      if (!s) continue
      poles.push({ position: [s.x, POLE_H / 2, s.z], scale: [0.07, POLE_H, 0.07] })
      arms.push({ position: [s.x, POLE_H - 0.1, s.z], scale: [ARM * 2, 0.05, 0.05], rotationY: s.a })
      lanterns.push({ position: [s.x + s.tx * (ARM - 0.04), POLE_H - 0.3, s.z + s.tz * (ARM - 0.04)], scale: [0.1, 0.15, 0.1] })
    }

    // Wires: two per span, between neighbouring poles only (no wire crosses a district). Each is a short sagging polyline.
    const SEG = 8
    const verts: number[] = []
    for (let i = 0; i < n; i++) {
      const p = spots[i], q = spots[(i + 1) % n]
      if (!p || !q) continue
      for (const side of [1, -1]) {
        const ax = p.x + p.tx * ARM * 0.8 * side, az = p.z + p.tz * ARM * 0.8 * side
        const bx = q.x + q.tx * ARM * 0.8 * side, bz = q.z + q.tz * ARM * 0.8 * side
        for (let k = 0; k < SEG; k++) {
          for (const t of [k / SEG, (k + 1) / SEG]) {
            verts.push(ax + (bx - ax) * t, POLE_H - 0.1 - 0.14 * 4 * t * (1 - t), az + (bz - az) * t)
          }
        }
      }
    }
    const wires = new THREE.BufferGeometry()
    wires.setAttribute('position', new THREE.BufferAttribute(new Float32Array(verts), 3))
    return { poles, arms, lanterns, wires }
  }, [quality])

  return (
    <group>
      <InstancedBoxes items={poles} color="#2B3566" />
      <InstancedBoxes items={arms} color="#2B3566" />
      <InstancedBoxes items={lanterns} color={COLORS.lantern} basic />
      <lineSegments geometry={wires} frustumCulled={false} raycast={() => null}>
        <lineBasicMaterial color="#6C7CC0" transparent opacity={0.8} />
      </lineSegments>
    </group>
  )
}
