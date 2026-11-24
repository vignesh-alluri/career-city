import { useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { TOWER, TOWER_TOP, towerHalfWidthAt } from '../utils/towerProfile'

export { TOWER_TOP }

const ORANGE = '#FF5A1F'   // the tower's "international orange", glowing
const GOLD = '#FFB15C'     // warm light on the lower rings
const WHITE = '#FFF1E0'
const RED = '#FF3B2E'
const CORNERS: ReadonlyArray<readonly [number, number]> = [[1, 1], [1, -1], [-1, -1], [-1, 1]]

const corner = (sx: number, sz: number, y: number) => {
  const h = towerHalfWidthAt(y)
  return new THREE.Vector3(sx * h, y, sz * h)
}

/** A thin box stretched between two points: one beam of the lattice. */
function strut(a: THREE.Vector3, b: THREE.Vector3, thickness: number): THREE.Matrix4 {
  const quaternion = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().lookAt(a, b, new THREE.Vector3(0, 1, 0)))
  return new THREE.Matrix4().compose(a.clone().add(b).multiplyScalar(0.5), quaternion, new THREE.Vector3(thickness, thickness, a.distanceTo(b)))
}

function InstancedStruts({ matrices, color }: { matrices: THREE.Matrix4[]; color: string }) {
  const ref = useRef<THREE.InstancedMesh>(null)
  useLayoutEffect(() => {
    matrices.forEach((m, i) => ref.current?.setMatrixAt(i, m))
    if (ref.current) ref.current.instanceMatrix.needsUpdate = true
  }, [matrices])
  if (matrices.length === 0) return null
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, matrices.length]} frustumCulled={false} raycast={() => null}>
      <boxGeometry args={[1, 1, 1]} />
      <meshBasicMaterial color={color} toneMapped={false} />
    </instancedMesh>
  )
}

/** A soft round glow, used behind the tower like the warm halo around the lit tower in the photo. */
function makeHaloTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = 128
  const ctx = canvas.getContext('2d')!
  const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64)
  g.addColorStop(0, 'rgba(255,255,255,0.9)')
  g.addColorStop(0.35, 'rgba(255,255,255,0.35)')
  g.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, 128, 128)
  return new THREE.CanvasTexture(canvas)
}

const Block = ({ y, size, color }: { y: number; size: [number, number, number]; color: string }) => (
  <mesh position-y={y}><boxGeometry args={size} /><meshBasicMaterial color={color} toneMapped={false} /></mesh>
)

/**
 * A blocky Tokyo Tower after the reference photo: four legs that sweep in along a curve, a dense criss-cross lattice,
 * two observation decks, a banded red-and-white antenna and a warm orange glow. The whole lattice is four draw calls.
 */
export function TokyoTower() {
  const halo = useMemo(makeHaloTexture, [])
  const { legs, lowerRings, upperRings, antennaRed, antennaWhite } = useMemo(() => {
    const rings = TOWER.ringHeights
    const legs: THREE.Matrix4[] = [], lowerRings: THREE.Matrix4[] = [], upperRings: THREE.Matrix4[] = []
    const antennaRed: THREE.Matrix4[] = [], antennaWhite: THREE.Matrix4[] = []

    for (let k = 0; k < rings.length - 1; k++) {
      const y0 = rings[k], y1 = rings[k + 1]
      for (let i = 0; i < 4; i++) {
        const [ax, az] = CORNERS[i], [bx, bz] = CORNERS[(i + 1) % 4]
        legs.push(strut(corner(ax, az, y0), corner(ax, az, y1), 0.085))                  // the leg, one curved segment
        legs.push(strut(corner(ax, az, y0), corner(bx, bz, y1), 0.04))                   // the X brace across this face
        legs.push(strut(corner(bx, bz, y0), corner(ax, az, y1), 0.04))
      }
    }
    for (const y of rings) {
      for (let i = 0; i < 4; i++) {
        const [ax, az] = CORNERS[i], [bx, bz] = CORNERS[(i + 1) % 4]
        ;(y <= TOWER.mainY ? lowerRings : upperRings).push(strut(corner(ax, az, y), corner(bx, bz, y), 0.05))
      }
    }
    for (let k = 0; k < TOWER.antennaBands; k++) {
      const width = 0.14 - k * 0.011
      const m = new THREE.Matrix4().compose(
        new THREE.Vector3(0, TOWER.antennaStart + k * TOWER.bandHeight + TOWER.bandHeight / 2, 0), new THREE.Quaternion(), new THREE.Vector3(width, TOWER.bandHeight, width),
      )
      ;(k % 2 === 0 ? antennaRed : antennaWhite).push(m)
    }
    return { legs, lowerRings, upperRings, antennaRed, antennaWhite }
  }, [])

  return (
    <group>
      <InstancedStruts matrices={legs} color={ORANGE} />
      <InstancedStruts matrices={lowerRings} color={GOLD} />
      <InstancedStruts matrices={upperRings} color={WHITE} />
      <InstancedStruts matrices={antennaRed} color={RED} />
      <InstancedStruts matrices={antennaWhite} color={WHITE} />
      {/* main observation deck: an orange skirt, a white two-storey body with a glowing band of windows, and a roof */}
      <Block y={TOWER.mainY - 0.2} size={[1.3, 0.1, 1.3]} color={ORANGE} />
      <Block y={TOWER.mainY} size={[1.55, 0.28, 1.55]} color={WHITE} />
      <Block y={TOWER.mainY + 0.02} size={[1.6, 0.12, 1.6]} color="#FFC27A" />
      <Block y={TOWER.mainY + 0.24} size={[1.2, 0.2, 1.2]} color={WHITE} />
      <Block y={TOWER.mainY + 0.37} size={[1.0, 0.06, 1.0]} color={ORANGE} />
      {/* top deck */}
      <Block y={TOWER.topY - 0.14} size={[0.5, 0.08, 0.5]} color={ORANGE} />
      <Block y={TOWER.topY} size={[0.62, 0.26, 0.62]} color={WHITE} />
      <Block y={TOWER.topY + 0.02} size={[0.66, 0.09, 0.66]} color="#FFC27A" />
      {/* warm halo, like the glow around the lit tower in the photo */}
      <sprite position={[0, 5.8, 0]} scale={[9, 14, 1]} raycast={() => null}>
        <spriteMaterial map={halo} color="#FF7A2F" transparent opacity={0.4} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} fog={false} />
      </sprite>
    </group>
  )
}
