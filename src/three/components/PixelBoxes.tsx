import { useLayoutEffect, useRef } from 'react'
import * as THREE from 'three'
import type { SignBox } from '../utils/signPixels'

/** Draws any number of coloured, turned boxes in one GPU call (same technique as the windows and shopfronts). */
export function PixelBoxes({ items }: { items: SignBox[] }) {
  const ref = useRef<THREE.InstancedMesh>(null)

  useLayoutEffect(() => {
    const mesh = ref.current
    if (!mesh) return
    const dummy = new THREE.Object3D()
    const tint = new THREE.Color()
    items.forEach((it, i) => {
      dummy.position.set(it.x, it.y, it.z)
      dummy.rotation.set(0, it.ry, 0)
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
    <instancedMesh key={items.length} ref={ref} args={[undefined, undefined, items.length]} frustumCulled={false} raycast={() => null}>
      <boxGeometry args={[1, 1, 1]} />
      <meshBasicMaterial toneMapped={false} />
    </instancedMesh>
  )
}
