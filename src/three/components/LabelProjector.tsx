import { useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { CityQuality } from '@/types'
import { labelAnchors } from '../utils/labelAnchors'
import { clampLabel } from '../utils/labelLayout'
import { labelElements } from '../labelRegistry'

const point = new THREE.Vector3()

/**
 * Runs inside the 3D scene. Every frame it turns each district's label anchor (a point in the 3D world) into a position on
 * the screen and moves that district's HTML label there. Because the labels are ordinary HTML laid over the canvas, nothing
 * in the 3D scene can hide them, and clampLabel keeps them inside the window so none can slide off an edge.
 */
export function LabelProjector({ quality }: { quality: CityQuality }) {
  const anchors = useMemo(() => labelAnchors(quality), [quality])

  useFrame(({ camera, size }) => {
    // Leave room for the page header above the city, but never more than a small share of a short box (the My city page).
    const inset = { left: 100, right: 100, top: Math.min(96, size.height * 0.15), bottom: 56 }
    for (const a of anchors) {
      const el = labelElements.get(a.id)
      if (!el) continue
      point.set(a.world[0], a.world[1], a.world[2]).project(camera) // -1..1 on both axes; z of 1 or more means behind the camera
      if (point.z >= 1) { el.style.opacity = '0'; continue }
      const { x, y } = clampLabel((point.x * 0.5 + 0.5) * size.width, (-point.y * 0.5 + 0.5) * size.height, size.width, size.height, inset)
      el.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%)`
      el.style.opacity = '1'
    }
  })
  return null
}
