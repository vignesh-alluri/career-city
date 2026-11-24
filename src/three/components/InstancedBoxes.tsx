import { useLayoutEffect, useRef } from 'react'
import * as THREE from 'three'
import type { BoxItem } from '../utils/toriiLayout'

export type { BoxItem }

/**
 * Many copies of one coloured box drawn in a single GPU call. Used for poles, lanterns and gates:
 * lots of small identical blocks, which also suits the blocky style of the city.
 */
export function InstancedBoxes({ items, color, basic = false }: { items: BoxItem[]; color: string; basic?: boolean }) {
  const ref = useRef<THREE.InstancedMesh>(null)

  useLayoutEffect(() => {
    const mesh = ref.current
    if (!mesh) return
    const dummy = new THREE.Object3D()
    items.forEach((it, i) => {
      dummy.position.set(...it.position)
      dummy.rotation.set(0, it.rotationY ?? 0, 0)
      dummy.scale.set(...it.scale)
      dummy.updateMatrix()
      mesh.setMatrixAt(i, dummy.matrix)
    })
    mesh.instanceMatrix.needsUpdate = true
  }, [items])

  if (items.length === 0) return null
  return (
    <instancedMesh key={items.length} ref={ref} args={[undefined, undefined, items.length]} frustumCulled={false} raycast={() => null}>
      <boxGeometry args={[1, 1, 1]} />
      {basic
        ? <meshBasicMaterial color={color} toneMapped={false} />
        : <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.35} roughness={0.55} />}
    </instancedMesh>
  )
}
