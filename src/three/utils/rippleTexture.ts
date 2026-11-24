import * as THREE from 'three'

/**
 * A grey picture of overlapping water ripples. The reflective ground uses it to nudge the reflection sideways by a
 * tiny, varying amount, which is what makes a puddle's reflection ripple and wobble instead of looking like a flat mirror.
 * Mid-grey means "no nudge"; lighter and darker rings push the reflection in opposite directions.
 */
export function makeRippleTexture(): THREE.CanvasTexture {
  const size = 1024
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = '#808080'
  ctx.fillRect(0, 0, size, size)
  ctx.filter = 'blur(1.5px)' // softens the rings where the browser supports it
  let seed = 12345 // a small fixed random sequence, so the ripples are identical on every load
  const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647)
  for (let i = 0; i < 170; i++) {
    const x = rand() * size, y = rand() * size, radius = 10 + rand() * 34
    for (let ring = 0; ring < 3; ring++) {
      ctx.beginPath()
      ctx.arc(x, y, radius * (0.4 + ring * 0.3), 0, Math.PI * 2)
      ctx.strokeStyle = ring % 2 === 0 ? 'rgba(255,255,255,0.22)' : 'rgba(0,0,0,0.22)'
      ctx.lineWidth = 2.5
      ctx.stroke()
    }
  }
  return new THREE.CanvasTexture(canvas)
}
