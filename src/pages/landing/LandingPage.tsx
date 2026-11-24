import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { DISTRICTS } from '@/config/districts'
import { buttonClass, Button } from '@/components/ui/Button'
import { useLandingScroll } from '@/animation/useLandingScroll'
import { scrollToSection } from '@/animation/scrollToSection'
import { useReducedMotion } from '@/hooks/useMediaQuery'
import { hasWebGL } from '@/lib/webgl'
import { useCityStore } from '@/store/cityStore'
import { CityStage } from './CityStage'
import { SectionFrame } from './SectionFrame'
import { DistrictMotif } from './DistrictMotif'
import { DistrictRail } from './DistrictRail'
import { DistrictPanel } from './DistrictPanel'
import { HoverTooltip } from './HoverTooltip'

/**
 * Phase 4: the city is a fixed full-screen backdrop; seven full-height sections scroll over it.
 * Section k lines up with camera stop k, so scrolling tours the city: overview, five districts, overview.
 */
export default function LandingPage() {
  const container = useRef<HTMLElement>(null)
  const reduced = useReducedMotion()
  const webgl = hasWebGL()
  useLandingScroll(container)

  useEffect(() => {
    // Gentle snapping: after scrolling stops near a section, the browser settles on it.
    document.documentElement.style.scrollSnapType = 'y proximity'
    return () => {
      document.documentElement.style.scrollSnapType = ''
      useCityStore.getState().reset()
    }
  }, [])

  return (
    <div className="relative">
      {webgl && (
        <>
          <CityStage />
          <DistrictRail />
          <DistrictPanel />
          <HoverTooltip />
        </>
      )}

      <header className="fixed inset-x-0 top-0 z-30 flex items-center justify-between px-6 py-5 md:px-[7vw]">
        <div className="flex items-center gap-3">
          <span className="font-display text-lg font-semibold tracking-tight">CAREER <span className="text-accent neon-text">CITY</span></span>
          <span className="hidden rounded-full border border-line px-2 py-0.5 text-xs text-muted sm:inline">Demo city: log in to build yours</span>
        </div>
        <Link to="/login" className="text-sm text-muted hover:text-ink">Log in</Link>
      </header>

      <main ref={container} className="pointer-events-none relative z-10">
        <SectionFrame index={0}>
          <h1 className="text-5xl leading-[1.05] font-semibold md:text-6xl">Your next opportunity starts here.</h1>
          <p lang="ja" className="mt-3 font-jp text-lg text-accent/80">次のチャンスは、ここから。</p>
          <p className="mt-5 max-w-md text-lg text-muted">One place to discover, manage and track every internship opportunity.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button size="lg" onClick={() => scrollToSection(1, reduced)}>Explore Career City</Button>
            <Link to="/register" className={buttonClass('secondary', 'lg')}>Get Started</Link>
          </div>
          {webgl && <p className="mt-6 text-sm text-muted">Scroll to tour the city, or click any district.</p>}
        </SectionFrame>

        {DISTRICTS.map((d, i) => (
          <SectionFrame key={d.id} index={i + 1}>
            <div className="flex items-start gap-5">
              {/* a hanging neon sign: the district's Japanese name, written vertically */}
              <span aria-hidden className="vertical-jp neon-text shrink-0 font-jp text-3xl font-bold md:text-4xl" style={{ color: d.color }}>{d.signs[0]}</span>
              <div>
                <h2 className="text-3xl leading-tight font-semibold md:text-5xl">{d.headline}</h2>
                <p className="mt-4 max-w-md text-base text-muted md:text-lg">{d.story}</p>
                <DistrictMotif id={d.id} color={d.color} />
              </div>
            </div>
          </SectionFrame>
        ))}

        <SectionFrame index={6}>
          <h2 className="text-4xl leading-tight font-semibold md:text-5xl">Build your career, one opportunity at a time.</h2>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/register" className={buttonClass('primary', 'lg')}>Start your journey</Link>
            <Button size="lg" variant="ghost" onClick={() => scrollToSection(0, reduced)}>Back to the top</Button>
          </div>
        </SectionFrame>
      </main>
    </div>
  )
}
