import { useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { ribbonGeometry } from '../utils/ribbon'
import { carPosition, type TrainSpec } from '../utils/trainPlacement'

const CARS = 6
const CAR_LENGTH = 1.5
const COUPLING = 0.12     // the little gap between two cars
const SPEED = 2.6         // world units per second
const SEGMENTS = 220
const PILLARS = 28

/**
 * A commuter train on its own elevated line, round the outside of the city (beyond the expressway), like the platform in the
 * reference photo: a silver body, a green band, and a strip of warm lit windows.
 * It is only three small instanced meshes of six cars each, so it costs next to nothing to draw.
 */
export function Train({ animate }: { animate: boolean }) {
  const body = useRef<THREE.InstancedMesh>(null)
  const windows = useRef<THREE.InstancedMesh>(null)
  const livery = useRef<THREE.InstancedMesh>(null)
  const pillars = useRef<THREE.InstancedMesh>(null)

  const curve = useMemo(() => {
    const pts: THREE.Vector3[] = []
    const N = 12
    for (let i = 0; i < N; i++) {
      const a = (i / N) * Math.PI * 2
      const r = 21.8 + 0.5 * Math.sin(2 * a + 1)             // a gentle wobble, so it is not a perfect circle
      pts.push(new THREE.Vector3(Math.sin(a) * r, 2.3 + 0.15 * Math.sin(3 * a), Math.cos(a) * r))
    }
    return new THREE.CatmullRomCurve3(pts, true, 'catmullrom', 0.5)
  }, [])

  const spec = useMemo<TrainSpec>(() => {
    const length = curve.getLength()
    return { cars: CARS, gap: (CAR_LENGTH + COUPLING) / length, speed: SPEED / length }
  }, [curve])

  const geoms = useMemo(() => ({
    deck: ribbonGeometry(curve, SEGMENTS, 0.2, 0, 0),
    railA: ribbonGeometry(curve, SEGMENTS, 0.018, 0.14, 0.02),
    railB: ribbonGeometry(curve, SEGMENTS, 0.018, -0.14, 0.02),
    // the car's three parts: each is a box that stands on the floor of the car (translate lifts it off the origin)
    body: new THREE.BoxGeometry(0.44, 0.34, CAR_LENGTH).translate(0, 0.2, 0),
    windows: new THREE.BoxGeometry(0.455, 0.1, CAR_LENGTH - 0.22).translate(0, 0.26, 0),
    livery: new THREE.BoxGeometry(0.455, 0.05, CAR_LENGTH).translate(0, 0.1, 0),
  }), [curve])

  const scratch = useMemo(() => ({ dummy: new THREE.Object3D(), p: new THREE.Vector3(), t: new THREE.Vector3(), look: new THREE.Vector3() }), [])

  const place = (time: number) => {
    const meshes = [body.current, windows.current, livery.current]
    if (meshes.some((m) => !m)) return
    const { dummy, p, t, look } = scratch
    for (let i = 0; i < CARS; i++) {
      const u = carPosition(spec, i, time)
      curve.getPointAt(u, p)
      curve.getTangentAt(u, t)
      dummy.position.copy(p)
      dummy.position.y += 0.02
      look.copy(p).add(t)
      dummy.lookAt(look)           // a Three.js object's own front (+z) turns towards the point it looks at: along the track
      dummy.updateMatrix()
      for (const m of meshes) m!.setMatrixAt(i, dummy.matrix)
    }
    for (const m of meshes) m!.instanceMatrix.needsUpdate = true
  }

  useLayoutEffect(() => { place(0) }, [spec]) // eslint-disable-line react-hooks/exhaustive-deps

  useLayoutEffect(() => {
    const mesh = pillars.current
    if (!mesh) return
    const dummy = new THREE.Object3D()
    const p = new THREE.Vector3()
    for (let i = 0; i < PILLARS; i++) {
      curve.getPointAt(i / PILLARS, p)
      dummy.position.set(p.x, p.y / 2, p.z)
      dummy.scale.set(1, p.y - 0.02, 1)
      dummy.updateMatrix()
      mesh.setMatrixAt(i, dummy.matrix)
    }
    mesh.instanceMatrix.needsUpdate = true
  }, [curve])

  useFrame(({ clock }) => { if (animate) place(clock.elapsedTime) })

  return (
    <group>
      <mesh geometry={geoms.deck} raycast={() => null}><meshStandardMaterial color="#0B0D1F" roughness={0.6} metalness={0.3} side={THREE.DoubleSide} /></mesh>
      <mesh geometry={geoms.railA} raycast={() => null}><meshBasicMaterial color="#35D9FF" toneMapped={false} side={THREE.DoubleSide} /></mesh>
      <mesh geometry={geoms.railB} raycast={() => null}><meshBasicMaterial color="#35D9FF" toneMapped={false} side={THREE.DoubleSide} /></mesh>
      <instancedMesh ref={pillars} args={[undefined, undefined, PILLARS]} frustumCulled={false} raycast={() => null}>
        <cylinderGeometry args={[0.06, 0.08, 1, 6]} />
        <meshStandardMaterial color="#0E1628" roughness={0.8} />
      </instancedMesh>
      <instancedMesh ref={body} args={[geoms.body, undefined, CARS]} frustumCulled={false} raycast={() => null}>
        <meshStandardMaterial color="#C9D6EE" roughness={0.45} metalness={0.25} />
      </instancedMesh>
      <instancedMesh ref={windows} args={[geoms.windows, undefined, CARS]} frustumCulled={false} raycast={() => null}>
        <meshBasicMaterial color="#FFF2CC" toneMapped={false} />
      </instancedMesh>
      <instancedMesh ref={livery} args={[geoms.livery, undefined, CARS]} frustumCulled={false} raycast={() => null}>
        <meshBasicMaterial color="#3DFF7A" toneMapped={false} />
      </instancedMesh>
    </group>
  )
}
