let cached: boolean | undefined

/** Returns true if this browser can create a WebGL context. The answer is cached because creating test contexts is wasteful. */
export function hasWebGL(): boolean {
  if (cached !== undefined) return cached
  try {
    const canvas = document.createElement('canvas')
    cached = !!(canvas.getContext('webgl2') || canvas.getContext('webgl'))
  } catch {
    cached = false
  }
  return cached
}
