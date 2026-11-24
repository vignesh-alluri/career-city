const float32 = new Float32Array(1)
const uint32 = new Uint32Array(float32.buffer)

/**
 * Converts a normal number to the 16-bit "half float" format that graphics cards use for compact textures:
 * 1 sign bit, 5 exponent bits, 10 fraction bits. It keeps about 3 decimal digits, which is plenty for water heights.
 * Values too small for the format become zero; too large ones are clamped to the biggest half float (65504).
 */
export function toHalfFloat(value: number): number {
  float32[0] = value
  const bits = uint32[0]
  const sign = (bits >>> 16) & 0x8000
  const exponent = ((bits >>> 23) & 0xff) - 127 + 15
  if (exponent <= 0) return sign
  if (exponent >= 31) return sign | 0x7bff
  return sign | (exponent << 10) | ((bits & 0x7fffff) >>> 13)
}
