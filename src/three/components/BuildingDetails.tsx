import { useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import type { CityQuality } from '@/types'
import type { BoxSpec } from '../utils/buildingLayout'
import { buildDetails } from '../utils/buildingDetails'

/** Draws every detail block of a district in one go, each with its own colour. */
export function BuildingDetails({ boxes, seed, quality }: { boxes: BoxSpec[]; seed: number; quality: CityQuality }) {
  const items = useMemo(() => buildDetails(boxes, seed, quality), [boxes, seed, quality])
  const ref = useRef<THREE.InstancedMesh>(null)

  useLayoutEffect(() => {
    const mesh = ref.current
    if (!mesh) return
    const dummy = new THREE.Object3D()
    const tint = new THREE.Color()
    items.forEach((it, i) => {
      dummy.position.set(it.x, it.y, it.z)
      dummy.scale.set(it.w, it.h, it.d)
      dummy.updateMatrix()
      mesh.setMatrixAt(i, dummy.matrix)
      mesh.setColorAt(i, tint.set(it.color))
    })
    mesh.instanceMatrix.needsUpdate = true
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
  }, [items])

  if (items.length === 0) return null
  return (
    // key = count: the GPU buffer is sized when created, so a different number of details needs a fresh mesh
    <instancedMesh key={items.length} ref={ref} args={[undefined, undefined, items.length]} frustumCulled={false} raycast={() => null}>
      <boxGeometry args={[1, 1, 1]} />
      <meshBasicMaterial toneMapped={false} />
    </instancedMesh>
  )
}
