import { useLayoutEffect, useMemo, useRef, useState } from 'react'
import type { ThreeEvent } from '@react-three/fiber'
import * as THREE from 'three'
import type { BoxSpec } from '../utils/buildingLayout'
import { buildingTheme, type WindowSpec } from '../utils/windows'
import { BODY_TINTS, COLORS, WINDOW_COLORS } from '../config/palette'

interface BuildingProps { boxes: BoxSpec[]; windows: WindowSpec[]; color: string; active: boolean; seed: number }

const WINDOW_NORMAL = new THREE.Color(1, 1, 1)
const WINDOW_ACTIVE = new THREE.Color(1.7, 1.7, 1.7) // values above 1 make an unlit material brighter than its base colour

/**
 * Renders ALL buildings of a district with three InstancedMeshes (bodies, roof trims, windows).
 *
 * Concept: an InstancedMesh draws one shared shape many times in a single GPU call, each copy with
 * its own position/scale/colour. Hundreds of separate <mesh> elements would be hundreds of draw calls.
 * Every building is a 1x1x1 box that we stretch to size through its instance matrix.
 */
export function Building({ boxes, windows, color, active, seed }: BuildingProps) {
  const bodyRef = useRef<THREE.InstancedMesh>(null)
  const roofRef = useRef<THREE.InstancedMesh>(null)
  const beaconRef = useRef<THREE.InstancedMesh>(null)
  const windowRef = useRef<THREE.InstancedMesh>(null)
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  const beacons = useMemo(() => boxes.filter((b) => !b.capped && (b.y0 ?? 0) + b.h > 3.2), [boxes])
  const roofColor = useMemo(() => new THREE.Color(color).multiplyScalar(0.45), [color])

  useLayoutEffect(() => {
    const body = bodyRef.current
    const roof = roofRef.current
    if (!body || !roof) return
    const dummy = new THREE.Object3D() // a scratch object used only to build matrices
    boxes.forEach((b, i) => {
      const base = b.y0 ?? 0
      dummy.position.set(b.x, base + b.h / 2, b.z)
      dummy.scale.set(b.w, b.h, b.d)
      dummy.updateMatrix()
      body.setMatrixAt(i, dummy.matrix)
      // a thin roof lip that overhangs the walls, like the eaves on Japanese buildings
      dummy.position.set(b.x, base + b.h + 0.035, b.z)
      dummy.scale.set(b.w * 1.1, 0.07, b.d * 1.1)
      dummy.updateMatrix()
      roof.setMatrixAt(i, dummy.matrix)
    })
    body.instanceMatrix.needsUpdate = true
    roof.instanceMatrix.needsUpdate = true
  }, [boxes])

  // Small red aviation lights on the tallest roofs, like the tiny red dots in the reference photo.
  useLayoutEffect(() => {
    const mesh = beaconRef.current
    if (!mesh) return
    const dummy = new THREE.Object3D()
    beacons.forEach((b, i) => {
      dummy.position.set(b.x, (b.y0 ?? 0) + b.h + 0.12, b.z)
      dummy.updateMatrix()
      mesh.setMatrixAt(i, dummy.matrix)
    })
    mesh.instanceMatrix.needsUpdate = true
  }, [beacons])

  // Per-building colour: the hovered building is tinted towards the district colour so it appears to glow.
  useLayoutEffect(() => {
    const body = bodyRef.current
    if (!body) return
    const target = new THREE.Color(color)
    for (let i = 0; i < boxes.length; i++) {
      const base = new THREE.Color(BODY_TINTS[buildingTheme(seed, i)])
      body.setColorAt(i, i === hoveredIndex ? base.lerp(target, 0.45) : base)
    }
    if (body.instanceColor) body.instanceColor.needsUpdate = true
  }, [boxes, hoveredIndex, color, seed])

  useLayoutEffect(() => {
    const mesh = windowRef.current
    if (!mesh) return
    const dummy = new THREE.Object3D()
    const tones = [...WINDOW_COLORS.map((c) => new THREE.Color(c)), new THREE.Color(color)]
    windows.forEach((w, i) => {
      dummy.position.set(w.x, w.y, w.z)
      dummy.rotation.set(0, w.ry, 0)
      dummy.updateMatrix()
      mesh.setMatrixAt(i, dummy.matrix)
      mesh.setColorAt(i, tones[w.tone])
    })
    mesh.instanceMatrix.needsUpdate = true
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
  }, [windows, color])

  const onMove = (e: ThreeEvent<PointerEvent>) => {
    // e.instanceId says WHICH copy of the instanced box the pointer is over
    if (e.instanceId !== undefined && e.instanceId !== hoveredIndex) setHoveredIndex(e.instanceId)
  }

  return (
    <group>
      <instancedMesh
        key={`body-${boxes.length}`} ref={bodyRef} args={[undefined, undefined, boxes.length]} frustumCulled={false}
        onPointerMove={onMove} onPointerOut={() => setHoveredIndex(null)}
      >
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#ffffff" roughness={0.55} metalness={0.25} emissive={color} emissiveIntensity={active ? 0.25 : 0.05} />
      </instancedMesh>
      <instancedMesh key={`roof-${boxes.length}`} ref={roofRef} args={[undefined, undefined, boxes.length]} frustumCulled={false}>
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial color={roofColor} toneMapped={false} />
      </instancedMesh>
      {beacons.length > 0 && (
        <instancedMesh key={`beacon-${beacons.length}`} ref={beaconRef} args={[undefined, undefined, beacons.length]} frustumCulled={false}>
          <sphereGeometry args={[0.06, 6, 6]} />
          <meshBasicMaterial color={COLORS.red} toneMapped={false} />
        </instancedMesh>
      )}
      {windows.length > 0 && (
        <instancedMesh key={`win-${windows.length}`} ref={windowRef} args={[undefined, undefined, windows.length]} frustumCulled={false}>
          <planeGeometry args={[0.12, 0.13]} />
          <meshBasicMaterial color={active ? WINDOW_ACTIVE : WINDOW_NORMAL} toneMapped={false} />
        </instancedMesh>
      )}
    </group>
  )
}
