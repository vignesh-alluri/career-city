import { Canvas } from '@react-three/fiber'
import type { CityQuality, DistrictId } from '@/types'
import { CityScene, type CityVariant } from './CityScene'
import { CAMERA_START } from './config/layout'

interface CityCanvasProps {
  quality: CityQuality
  reducedMotion: boolean
  paused: boolean
  counts?: Record<DistrictId, number>
  variant?: CityVariant
  onDegrade?: () => void
}

/** Default export so it can be lazy-loaded: the Three.js code is only downloaded when this component is first needed. */
export default function CityCanvas({ quality, reducedMotion, paused, counts, variant = 'tour', onDegrade }: CityCanvasProps) {
  return (
    <Canvas
      role="img"
      aria-label="Interactive 3D city with five districts: Discovery, Application, Interview, Achievement and Analytics"
      frameloop={paused ? 'never' : 'always'} // 'never' = no GPU work while the city is off-screen
      dpr={quality === 'high' ? [1, 1.5] : 1} // cap pixel density: retina screens would otherwise render 4x the pixels (the scene then adapts it to the measured frame rate)
      gl={{ antialias: quality === 'high', powerPreference: 'high-performance' }}
      camera={{ position: variant === 'orbit' ? [32, 24, 32] : CAMERA_START, fov: variant === 'orbit' ? 34 : 30, near: 1, far: 200 }}
    >
      <CityScene quality={quality} reducedMotion={reducedMotion} counts={counts} variant={variant} onDegrade={onDegrade} />
    </Canvas>
  )
}
