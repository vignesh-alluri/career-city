import { useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { CityQuality } from '@/types'
import { COLORS } from '../config/palette'
import { ribbonGeometry } from '../utils/ribbon'
import { HighwayLamps } from './HighwayLamps'

const SEGMENTS = 260
const PILLARS = 38

/**
 * An elevated expressway looping round the outside of the city, with glowing lane lines and moving car lights:
 * the warm orange light trails are one of the most striking parts of the reference photo.
 */
export function Highway({ animate, quality }: { animate: boolean; quality: CityQuality }) {
  const carsRef = useRef<THREE.InstancedMesh>(null)
  const pillarsRef = useRef<THREE.InstancedMesh>(null)

  const curve = useMemo(() => {
    const pts: THREE.Vector3[] = []
    const N = 14
    for (let i = 0; i < N; i++) {
      const a = (i / N) * Math.PI * 2
      const r = 18 + 1.4 * Math.sin(3 * a + 0.5) + 0.8 * Math.sin(5 * a) // wobble so the loop is not a perfect circle
      pts.push(new THREE.Vector3(Math.sin(a) * r, 1.3 + 0.35 * Math.sin(2 * a), Math.cos(a) * r))
    }
    return new THREE.CatmullRomCurve3(pts, true, 'catmullrom', 0.5)
  }, [])

  const geoms = useMemo(() => ({
    deck: ribbonGeometry(curve, SEGMENTS, 0.5, 0, 0),
    center: ribbonGeometry(curve, SEGMENTS, 0.05, 0, 0.02),
    edgeA: ribbonGeometry(curve, SEGMENTS, 0.03, 0.43, 0.02),
    edgeB: ribbonGeometry(curve, SEGMENTS, 0.03, -0.43, 0.02),
  }), [curve])

  const cars = useMemo(() => {
    const count = quality === 'high' ? 40 : 20
    return Array.from({ length: count }, (_, i) => ({
      t0: i / count,
      speed: (0.012 + (i % 5) * 0.004) * (i % 2 === 0 ? 1 : -1),
      lane: i % 2 === 0 ? 0.17 : -0.17,
    }))
  }, [quality])

  const scratch = useMemo(() => ({
    dummy: new THREE.Object3D(), p: new THREE.Vector3(), t: new THREE.Vector3(), side: new THREE.Vector3(), look: new THREE.Vector3(),
  }), [])

  const placeCars = (time: number) => {
    const mesh = carsRef.current
    if (!mesh) return
    const { dummy, p, t, side, look } = scratch
    cars.forEach((car, i) => {
      const u = (((car.t0 + car.speed * time) % 1) + 1) % 1
      curve.getPointAt(u, p)
      curve.getTangentAt(u, t)
      side.crossVectors(new THREE.Vector3(0, 1, 0), t).normalize()
      dummy.position.copy(p).addScaledVector(side, car.lane)
      dummy.position.y += 0.07
      look.copy(dummy.position).addScaledVector(t, car.speed > 0 ? 1 : -1)
      dummy.lookAt(look)
      dummy.updateMatrix()
      mesh.setMatrixAt(i, dummy.matrix)
    })
    mesh.instanceMatrix.needsUpdate = true
  }

  useLayoutEffect(() => {
    const mesh = carsRef.current
    if (mesh) {
      const warm = new THREE.Color(COLORS.amber)
      const white = new THREE.Color('#FFF1D6')
      cars.forEach((car, i) => mesh.setColorAt(i, car.speed > 0 ? warm : white))
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
    }
    placeCars(0)
  }, [cars]) // eslint-disable-line react-hooks/exhaustive-deps

  useLayoutEffect(() => {
    const mesh = pillarsRef.current
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

  useFrame(({ clock }) => { if (animate) placeCars(clock.elapsedTime) })

  return (
    <group>
      <mesh geometry={geoms.deck}><meshStandardMaterial color="#0B0D1F" roughness={0.7} metalness={0.3} side={THREE.DoubleSide} /></mesh>
      <mesh geometry={geoms.center}><meshBasicMaterial color={COLORS.amber} toneMapped={false} side={THREE.DoubleSide} /></mesh>
      <mesh geometry={geoms.edgeA}><meshBasicMaterial color={COLORS.pink} toneMapped={false} side={THREE.DoubleSide} /></mesh>
      <mesh geometry={geoms.edgeB}><meshBasicMaterial color={COLORS.pink} toneMapped={false} side={THREE.DoubleSide} /></mesh>
      <instancedMesh ref={pillarsRef} args={[undefined, undefined, PILLARS]} frustumCulled={false}>
        <cylinderGeometry args={[0.07, 0.09, 1, 6]} />
        <meshStandardMaterial color="#0E1628" roughness={0.8} />
      </instancedMesh>
      <HighwayLamps curve={curve} count={quality === 'high' ? 16 : 9} />
      <instancedMesh key={cars.length} ref={carsRef} args={[undefined, undefined, cars.length]} frustumCulled={false}>
        <boxGeometry args={[0.09, 0.05, 0.26]} />
        <meshBasicMaterial toneMapped={false} />
      </instancedMesh>
    </group>
  )
}
