import { useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'

const POOL = 0.62 // radius of each pool of light on the road

/** A soft round glow, white in the middle fading to nothing: the picture of a pool of light, drawn once on a tiny canvas. */
function makeGlowTexture(): THREE.CanvasTexture {
  const size = 64
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = size
  const ctx = canvas.getContext('2d')!
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
  g.addColorStop(0, 'rgba(255,255,255,1)')
  g.addColorStop(0.45, 'rgba(255,255,255,0.35)')
  g.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, size, size)
  return new THREE.CanvasTexture(canvas)
}

/**
 * Street lamps along the outer edge of the expressway: a slim pole, an arm reaching over the lane, a warm lit head, and a pool of
 * light on the road below it. Real lights would be far too expensive for this many, so the glow is just a soft picture laid on the
 * deck (added to what is already there, so it brightens the road). Three instanced meshes in total.
 */
export function HighwayLamps({ curve, count }: { curve: THREE.CatmullRomCurve3; count: number }) {
  const poles = useRef<THREE.InstancedMesh>(null)
  const heads = useRef<THREE.InstancedMesh>(null)
  const pools = useRef<THREE.InstancedMesh>(null)
  const glow = useMemo(() => makeGlowTexture(), [])

  useLayoutEffect(() => {
    const meshes = [poles.current, heads.current, pools.current]
    if (meshes.some((m) => !m)) return
    const dummy = new THREE.Object3D()
    const p = new THREE.Vector3(), t = new THREE.Vector3(), inward = new THREE.Vector3()
    const up = new THREE.Vector3(0, 1, 0)
    for (let i = 0; i < count; i++) {
      const u = (i + 0.5) / count
      curve.getPointAt(u, p)
      curve.getTangentAt(u, t)
      inward.crossVectors(up, t).normalize() // points towards the middle of the city: the pole stands on the opposite, outer edge

      // the pole: stands on the outer edge of the deck
      dummy.rotation.set(0, 0, 0); dummy.scale.set(1, 1, 1)
      dummy.position.copy(p).addScaledVector(inward, -0.46); dummy.position.y += 0.27
      dummy.updateMatrix(); poles.current!.setMatrixAt(i, dummy.matrix)

      // the lamp head: out over the lane, at the top of the pole, turned to follow the road
      dummy.position.copy(p).addScaledVector(inward, -0.34); dummy.position.y += 0.55
      dummy.lookAt(dummy.position.clone().add(t))
      dummy.updateMatrix(); heads.current!.setMatrixAt(i, dummy.matrix)

      // the pool of light: flat on the road, under the head
      dummy.position.copy(p).addScaledVector(inward, -0.2); dummy.position.y += 0.035
      dummy.rotation.set(-Math.PI / 2, 0, 0); dummy.scale.set(1, 1, 1)
      dummy.updateMatrix(); pools.current!.setMatrixAt(i, dummy.matrix)
    }
    for (const m of meshes) m!.instanceMatrix.needsUpdate = true
  }, [curve, count])

  return (
    <group>
      <instancedMesh key={`p${count}`} ref={poles} args={[undefined, undefined, count]} frustumCulled={false} raycast={() => null}>
        <cylinderGeometry args={[0.011, 0.016, 0.54, 6]} />
        <meshStandardMaterial color="#0E1628" roughness={0.7} metalness={0.4} />
      </instancedMesh>
      <instancedMesh key={`h${count}`} ref={heads} args={[undefined, undefined, count]} frustumCulled={false} raycast={() => null}>
        <boxGeometry args={[0.07, 0.014, 0.17]} />
        <meshBasicMaterial color="#FFE7B0" toneMapped={false} />
      </instancedMesh>
      <instancedMesh key={`g${count}`} ref={pools} args={[undefined, undefined, count]} frustumCulled={false} raycast={() => null}>
        <circleGeometry args={[POOL, 20]} />
        <meshBasicMaterial map={glow} color="#FFC987" transparent opacity={0.55} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
      </instancedMesh>
    </group>
  )
}
