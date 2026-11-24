import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { scrollPose, scrollState, stopPose, TWO_PI, zoomFor, type CameraPose } from '@/animation/cameraRig'
import { useCityStore } from '@/store/cityStore'

/**
 * Moves the camera every frame towards a "desired pose" and eases into it.
 * The desired pose comes from the scroll position (scroll mode) or the selected district (explore mode).
 * Easing means a sudden jump in scroll or a click never produces a sudden jump on screen.
 *
 * Only this component moves the camera, so scroll and click can never fight each other.
 */
export function CameraController({ reducedMotion }: { reducedMotion: boolean }) {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera
  const aspect = useThree((s) => s.size.width / s.size.height)
  const current = useRef<CameraPose | null>(null)

  useEffect(() => {
    camera.zoom = zoomFor(aspect)
    camera.updateProjectionMatrix()
  }, [camera, aspect])

  useFrame((_, delta) => {
    // getState() reads the store WITHOUT subscribing, so reading it 60 times a second causes no re-renders.
    const { mode, selected } = useCityStore.getState()
    const desired = mode === 'explore' ? stopPose(selected ?? 'overview', aspect) : scrollPose(scrollState.progress, aspect)
    const dt = Math.min(delta, 0.05) // avoid a lurch after the tab was in the background
    const lambda = reducedMotion ? 1000 : 3.2 // higher = snappier; reduced motion effectively cuts instantly

    if (!current.current) current.current = { ...desired, target: [desired.target[0], desired.target[1], desired.target[2]] }
    const c = current.current

    // Take the shortest way round the city: shift the target angle by whole turns to be nearest the current one.
    const turns = Math.round((c.angle - desired.angle) / TWO_PI)
    c.angle = THREE.MathUtils.damp(c.angle, desired.angle + turns * TWO_PI, lambda, dt)
    c.radius = THREE.MathUtils.damp(c.radius, desired.radius, lambda, dt)
    c.height = THREE.MathUtils.damp(c.height, desired.height, lambda, dt)
    c.target = [
      THREE.MathUtils.damp(c.target[0], desired.target[0], lambda, dt),
      THREE.MathUtils.damp(c.target[1], desired.target[1], lambda, dt),
      THREE.MathUtils.damp(c.target[2], desired.target[2], lambda, dt),
    ]

    camera.position.set(Math.sin(c.angle) * c.radius, c.height, Math.cos(c.angle) * c.radius)
    camera.lookAt(c.target[0], c.target[1], c.target[2])
  })

  return null
}
