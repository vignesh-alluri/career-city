import { lazy, Suspense } from 'react'
import { DISTRICTS } from '@/config/districts'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { useCityQuality, useReducedMotion, useSideLayout } from '@/hooks/useMediaQuery'
import { useInView } from '@/hooks/useInView'
import { cn } from '@/lib/utils'
import { DistrictLabels } from './DistrictLabels'

// React.lazy + dynamic import(): the whole three/ folder (and Three.js itself) becomes a separate
// file that the browser downloads only when this component first renders.
const CityCanvas = lazy(() => import('@/three/CityCanvas'))

/** Full-screen 3D backdrop. If it fails, the story text on top of it still carries all the information. */
export function CityStage() {
  const quality = useCityQuality()
  const reducedMotion = useReducedMotion()
  const side = useSideLayout()
  const [ref, inView] = useInView<HTMLDivElement>()

  return (
    <div ref={ref} className="fixed inset-0 z-0 bg-void">
      <ErrorBoundary fallback={null}>
        <Suspense fallback={<div className="flex h-full items-center justify-center text-sm text-muted" role="status"><span className="animate-pulse">Building the city...</span></div>}>
          <CityCanvas quality={quality} reducedMotion={reducedMotion} paused={!inView} />
        </Suspense>
      </ErrorBoundary>
      {/* Legibility scrim behind the story text. It lives INSIDE the stage (z-1) so the 3D labels (z 10-100) stay above it. */}
      <div
        aria-hidden
        className={cn('pointer-events-none absolute inset-0 z-[1]', side ? 'bg-linear-to-r from-void/70 via-void/15 to-transparent' : 'bg-linear-to-t from-void/80 via-void/10 to-transparent')}
      />
      <DistrictLabels />
      {/* The canvas is a picture to screen readers, so give them the same information as text. */}
      <ul className="sr-only">
        {DISTRICTS.map((d) => <li key={d.id}>{d.name}: {d.description}</li>)}
      </ul>
    </div>
  )
}
