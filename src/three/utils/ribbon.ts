import * as THREE from 'three'

/**
 * Builds a flat strip that follows a curve (a road surface, a lane line...).
 * For each sample along the curve we compute the sideways direction and place a left and a right vertex,
 * then join consecutive pairs with two triangles.
 */
export function ribbonGeometry(curve: THREE.Curve<THREE.Vector3>, segments: number, halfWidth: number, lateral: number, lift: number): THREE.BufferGeometry {
  const positions: number[] = []
  const indices: number[] = []
  const up = new THREE.Vector3(0, 1, 0)
  for (let i = 0; i <= segments; i++) {
    const u = i / segments
    const p = curve.getPointAt(u)
    const t = curve.getTangentAt(u)
    const side = new THREE.Vector3().crossVectors(up, t).normalize()
    const c = p.clone().addScaledVector(side, lateral)
    c.y += lift
    const l = c.clone().addScaledVector(side, -halfWidth)
    const r = c.clone().addScaledVector(side, halfWidth)
    positions.push(l.x, l.y, l.z, r.x, r.y, r.z)
    if (i < segments) {
      const a = i * 2
      indices.push(a, a + 2, a + 1, a + 1, a + 2, a + 3)
    }
  }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  g.setIndex(indices)
  g.computeVertexNormals()
  return g
}
