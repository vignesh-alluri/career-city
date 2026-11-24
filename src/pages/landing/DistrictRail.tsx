import { DISTRICTS } from '@/config/districts'
import { scrollToSection } from '@/animation/scrollToSection'
import { useReducedMotion } from '@/hooks/useMediaQuery'
import { useCityStore } from '@/store/cityStore'
import { cn } from '@/lib/utils'

const STOPS = [{ id: 'overview', name: 'City overview', color: '#9AA0C8' }, ...DISTRICTS]

/** Dot navigation on the right edge: jump straight to the overview or to any district. */
export function DistrictRail() {
  const activeSection = useCityStore((s) => s.activeSection)
  const mode = useCityStore((s) => s.mode)
  const reduced = useReducedMotion()
  const current = activeSection === 6 ? 0 : activeSection

  return (
    <nav aria-label="Districts" className="fixed top-1/2 right-3 z-30 flex -translate-y-1/2 flex-col gap-1 md:right-6">
      {STOPS.map((stop, i) => {
        const isCurrent = mode === 'scroll' && current === i
        return (
          <button
            key={stop.id} type="button" onClick={() => scrollToSection(i, reduced)}
            aria-label={stop.name} aria-current={isCurrent ? 'true' : undefined}
            className="group relative flex size-7 items-center justify-center"
          >
            <span
              className={cn('block rounded-full transition-all', isCurrent ? 'size-3' : 'size-2 bg-muted/50 group-hover:bg-muted')}
              style={isCurrent ? { background: stop.color, boxShadow: `0 0 10px ${stop.color}` } : undefined}
            />
            <span className="glass pointer-events-none absolute right-8 rounded-control px-2 py-1 text-xs whitespace-nowrap opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
              {stop.name}
            </span>
          </button>
        )
      })}
    </nav>
  )
}
