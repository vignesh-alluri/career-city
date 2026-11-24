import { useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import type { CityQuality } from '@/types'
import { DISTRICT_LAYOUTS, DISTRICT_RADIUS, RING_RADIUS, type Vec3 } from '../config/layout'

/** Small glowing bollards lining both edges of the ring road. One InstancedMesh = one draw call for all of them. */
export function CityDecor({ quality }: { quality: CityQuality }) {
  const ref = useRef<THREE.InstancedMesh>(null)

  const points = useMemo(() => {
    const perRing = quality === 'high' ? 48 : 24
    const out: Vec3[] = []
    for (const radius of [RING_RADIUS - 0.8, RING_RADIUS + 0.8]) {
      for (let i = 0; i < perRing; i++) {
        const a = (i / perRing) * Math.PI * 2
        const x = Math.sin(a) * radius
        const z = Math.cos(a) * radius
        // skip any bollard that would end up inside a district platform
        const insideDistrict = DISTRICT_LAYOUTS.some((l) => Math.hypot(l.position[0] - x, l.position[2] - z) < DISTRICT_RADIUS + 0.7)
        if (!insideDistrict) out.push([x, 0.27, z])
      }
    }
    return out
  }, [quality])

  useLayoutEffect(() => {
    const mesh = ref.current
    if (!mesh) return
    const dummy = new THREE.Object3D()
    points.forEach((p, i) => {
      dummy.position.set(...p)
      dummy.updateMatrix()
      mesh.setMatrixAt(i, dummy.matrix)
    })
    mesh.instanceMatrix.needsUpdate = true
  }, [points])

  return (
    <instancedMesh key={points.length} ref={ref} args={[undefined, undefined, points.length]} frustumCulled={false}>
      <boxGeometry args={[0.08, 0.4, 0.08]} />
      <meshBasicMaterial color="#FF3D9A" toneMapped={false} />
    </instancedMesh>
  )
}
