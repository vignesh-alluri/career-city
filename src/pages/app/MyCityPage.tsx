import { lazy, Suspense, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { Button, buttonClass } from '@/components/ui/Button'
import { busiest } from '@/selectors/busiest'
import { PageHeader } from '@/components/ui/PageHeader'
import { DataGate } from '@/components/ui/DataGate'
import { DISTRICTS, DISTRICT_BY_ID } from '@/config/districts'
import { useCityQuality, useReducedMotion } from '@/hooks/useMediaQuery'
import { useCityData } from '@/hooks/useCityData'
import { useInView } from '@/hooks/useInView'
import { hasWebGL } from '@/lib/webgl'
import type { CityMetrics } from '@/selectors/city'
import { useCityStore } from '@/store/cityStore'
import { useModalStore } from '@/store/modalStore'
import { HoverTooltip } from '@/pages/landing/HoverTooltip'
import { DistrictLabels } from '@/pages/landing/DistrictLabels'

// Loaded only when this page opens, so the rest of the app never downloads Three.js.
const CityCanvas = lazy(() => import('@/three/CityCanvas'))

/** What each district counts, in plain words (shown under its name). */
const MEANING: Record<string, string> = {
  discovery: 'saved roles', application: 'applied or in assessment', interview: 'at interview stage', achievement: 'offers and accepted', analytics: 'all applications',
}

function CityView({ metrics }: { metrics: CityMetrics }) {
  // the busiest of the four stage districts (Analytics counts everything, so it would always win)
  const top = busiest(metrics.counts, DISTRICTS.filter((d) => d.id !== 'analytics').map((d) => d.id))
  const quality = useCityQuality()
  const reducedMotion = useReducedMotion()
  const [ref, inView] = useInView<HTMLDivElement>()
  const selected = useCityStore((s) => s.selected)
  const select = useCityStore((s) => s.select)
  const openModal = useModalStore((s) => s.open)
  const info = selected ? DISTRICT_BY_ID[selected] : null
  const [autoLight, setAutoLight] = useState(false)

  // Leaving the page must not leave a district "selected" for the landing page to find later.
  useEffect(() => () => useCityStore.getState().reset(), [])

  return (
    <div className="flex flex-col gap-4">
      <ul className="grid grid-cols-2 gap-3 md:grid-cols-5">
        {DISTRICTS.map((d, i) => (
          <li key={d.id}>
            <button
              type="button" onClick={() => select(d.id)} aria-pressed={selected === d.id}
              className="w-full rounded-panel border border-line bg-card p-3 text-left transition-colors hover:border-accent/50 aria-pressed:border-accent"
            >
              <span className="flex items-center gap-2 text-sm text-muted">
                {/* each district is a platform: a number sign in the district's own colour */}
                <span
                  aria-hidden className="flex size-5 items-center justify-center rounded-[4px] border-2 font-mono text-[11px] font-bold"
                  style={{ borderColor: d.color, color: d.color, boxShadow: `0 0 8px ${d.color}66` }}
                >{i + 1}</span>
                {d.name}
              </span>
              <span className="mt-1 block font-display text-2xl font-semibold tabular-nums">{metrics.counts[d.id]}</span>
              <span className="block text-xs text-muted">{MEANING[d.id]}</span>
            </button>
          </li>
        ))}
      </ul>

      <div ref={ref} className="relative h-[min(68vh,620px)] overflow-hidden rounded-panel border border-line bg-void">
        {hasWebGL() ? (
          <ErrorBoundary fallback={<p className="p-6 text-sm text-muted">The 3D city could not start on this device. Your numbers above are still up to date.</p>}>
            <Suspense fallback={<p role="status" className="flex h-full items-center justify-center text-sm text-muted"><span className="animate-pulse">Building your city...</span></p>}>
              <CityCanvas quality={quality} reducedMotion={reducedMotion} paused={!inView} counts={metrics.counts} variant="orbit" onDegrade={() => setAutoLight(true)} />
            </Suspense>
          </ErrorBoundary>
        ) : (
          <p className="p-6 text-sm text-muted">This browser cannot show the 3D city (WebGL is unavailable). Your numbers above are still up to date.</p>
        )}
        {hasWebGL() && <DistrictLabels />}
        <HoverTooltip />
        {metrics.total === 0 && (
          <div className="absolute inset-x-4 bottom-4 flex flex-col items-start gap-3 rounded-panel border border-accent/40 bg-void/85 p-4 backdrop-blur md:inset-x-auto md:max-w-sm">
            <p className="font-medium">Your city is waiting to be built</p>
            <p className="text-sm text-muted">Every application you add becomes a building. Add your first one and watch the city grow.</p>
            <Button onClick={() => openModal({ kind: 'create', defaultStatus: 'saved' })}><Plus size={16} /> Add application</Button>
          </div>
        )}
      </div>

      {autoLight && (
        <p role="status" className="rounded-panel border border-line bg-card px-4 py-3 text-sm text-muted">
          The city was running slowly, so it switched to light effects (no mirror reflections, smaller water) to stay smooth.{' '}
          <Link to="/app/settings" className="text-accent underline">Change this in Settings</Link>.
        </p>
      )}

      {info && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-panel border border-line bg-card p-4">
          <div>
            <p className="font-medium" style={{ color: info.color }}>{info.name}</p>
            <p className="text-sm text-muted">{info.description}</p>
          </div>
          <Link to={info.appRoute} className={buttonClass('secondary')}>Open in tracker</Link>
        </div>
      )}
      <p className="text-xs text-muted">
        One application = one building. Districts grow outward from their landmark, and once a district is full its towers grow taller.
        {metrics.rejected > 0 && ` ${metrics.rejected} rejected application${metrics.rejected === 1 ? ' is' : 's are'} counted in Analytics but not drawn as buildings.`}
        {top && ` Busiest district: ${DISTRICT_BY_ID[top.id as keyof typeof DISTRICT_BY_ID].name} (${top.count}).`}
        {' '}Drag to look around.
      </p>
    </div>
  )
}

export default function MyCityPage() {
  const { applications, reminders, metrics } = useCityData()
  return (
    <div className="flex flex-col gap-6">
      <PageHeader id="city" title="My city" description="Your internship search, built block by block." />
      <DataGate queries={[applications, reminders]}>{() => (metrics ? <CityView metrics={metrics} /> : null)}</DataGate>
    </div>
  )
}
