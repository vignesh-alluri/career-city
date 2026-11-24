import { useEffect, useRef, useState } from 'react'
import { OrbitControls, PerformanceMonitor, Stats } from '@react-three/drei'
import { useThree } from '@react-three/fiber'
import type { CityQuality, DistrictId } from '@/types'
import { DISTRICT_BY_ID } from '@/config/districts'
import { usePreferences } from '@/store/preferencesStore'
import { adaptiveDpr, planEffects } from './utils/effects'
import { DISTRICT_LAYOUTS } from './config/layout'
import { COLORS } from './config/palette'
import { CityLighting } from './components/CityLighting'
import { CityGround } from './components/CityGround'
import { RoadNetwork } from './components/RoadNetwork'
import { CentralPlaza } from './components/CentralPlaza'
import { CityDecor } from './components/CityDecor'
import { Highway } from './components/Highway'
import { Train } from './components/Train'
import { District } from './components/District'
import { CameraController } from './components/CameraController'
import { SkyDome } from './components/SkyDome'
import { Rain } from './components/Rain'
import { StreetFurniture } from './components/StreetFurniture'
import { ToriiGates } from './components/ToriiGates'
import { NeonPools } from './components/NeonPools'
import { SunGlint } from './components/SunGlint'
import { PointerRipples } from './components/PointerRipples'
import { LabelProjector } from './components/LabelProjector'

export type CityVariant = 'tour' | 'orbit'

// Adding ?fps to the page address shows a live frames-per-second counter (used for the performance checks in the README).
const showFps = typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('fps')

interface CityStageProps {
  quality: CityQuality
  reducedMotion: boolean
  /** Real counts per district. Leave out for the demo city (everything built). */
  counts?: Record<DistrictId, number>
  /** 'tour': the camera follows page scroll (landing page). 'orbit': the visitor drags to look around (My city page). */
  variant?: CityVariant
  /** Called once if the city measured itself running too slowly and switched the expensive effects off (auto mode only). */
  onDegrade?: () => void
}

/** A declined frame rate is ignored for this long after the city appears: shaders compile and textures upload at the start. */
const WARM_UP_MS = 4000

export function CityScene({ quality, reducedMotion, counts, variant = 'tour', onDegrade }: CityStageProps) {
  const setting = usePreferences((s) => s.cityEffects)
  const [degraded, setDegraded] = useState(false)
  const plan = planEffects(quality, setting, degraded)
  const setDpr = useThree((s) => s.setDpr)
  const startedAt = useRef(0)
  useEffect(() => { startedAt.current = performance.now() }, [])

  return (
    <>
      {/* Watches the real frame rate. It lowers the pixel density smoothly when frames get slow, and in 'auto' mode,
          if the frame rate stays low, it switches the expensive effects (mirror reflections, big water) off for good. */}
      <PerformanceMonitor
        onChange={({ factor }) => { if (plan.maxDpr > 1) setDpr(adaptiveDpr(factor, plan.maxDpr)) }}
        onDecline={() => {
          if (setting !== 'auto' || degraded || quality === 'low') return
          if (performance.now() - startedAt.current < WARM_UP_MS) return
          setDegraded(true)
          setDpr(1)
          onDegrade?.()
        }}
      />
      <color attach="background" args={[COLORS.void]} />
      {quality === 'high' && <fog attach="fog" args={['#0F2A63', 62, 140]} />}
      <SkyDome />
      <SunGlint tour={variant === 'tour'} animate={!reducedMotion} />
      <CityLighting />
      <CityGround reflections={plan.reflections} />
      <RoadNetwork reflective={plan.reflections} />
      <NeonPools />
      <PointerRipples enabled={!reducedMotion} cells={plan.waterCells} rain={variant !== 'tour'} />
      <LabelProjector quality={quality} />
      <CentralPlaza animate={!reducedMotion} />
      <CityDecor quality={quality} />
      <StreetFurniture quality={quality} />
      <ToriiGates />
      <Highway animate={!reducedMotion} quality={quality} />
      <Train animate={!reducedMotion} />
      {DISTRICT_LAYOUTS.map((layout) => (
        <District key={layout.id} info={DISTRICT_BY_ID[layout.id]} layout={layout} quality={quality} animate={!reducedMotion} count={counts?.[layout.id]} />
      ))}
      {showFps && <Stats />}
      <Rain count={plan.rainStreaks} animate={!reducedMotion} />
      {variant === 'tour' ? (
        <CameraController reducedMotion={reducedMotion} />
      ) : (
        // Zoom is off so scrolling the page never gets captured by the city; dragging rotates it.
        <OrbitControls
          target={[0, 2.5, 0]} enablePan={false} enableZoom={false} autoRotate={!reducedMotion} autoRotateSpeed={0.5}
          minPolarAngle={0.5} maxPolarAngle={1.3}
        />
      )}
    </>
  )
}
