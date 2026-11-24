import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import { DISTRICTS, DISTRICT_BY_ID } from '@/config/districts'
import { Button, buttonClass } from '@/components/ui/Button'
import { useReducedMotion, useSideLayout } from '@/hooks/useMediaQuery'
import { useCityStore } from '@/store/cityStore'
import { DISTRICT_IDS } from '@/types'
import { cn } from '@/lib/utils'

/** Floating HTML panel shown while the user is exploring: district details, Explore, previous/next, and a way back to the overview. */
export function DistrictPanel() {
  const mode = useCityStore((s) => s.mode)
  const selected = useCityStore((s) => s.selected)
  const { select, showOverview, resumeScroll } = useCityStore.getState()
  const side = useSideLayout()
  const reduced = useReducedMotion()
  const info = selected ? DISTRICT_BY_ID[selected] : null

  useEffect(() => {
    if (mode !== 'explore') return
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      if (useCityStore.getState().selected) useCityStore.getState().showOverview()
      else useCityStore.getState().resumeScroll()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [mode])

  const step = (delta: number) => {
    if (!selected) return
    select(DISTRICT_IDS[(DISTRICT_IDS.indexOf(selected) + delta + DISTRICT_IDS.length) % DISTRICT_IDS.length])
  }

  return (
    <div className={cn('pointer-events-none fixed z-30', side ? 'top-1/2 left-[7vw] w-[min(26rem,40vw)] -translate-y-1/2' : 'inset-x-4 bottom-4')}>
      <AnimatePresence mode="wait">
        {mode === 'explore' && (
          <motion.aside
            key={selected ?? 'overview'}
            aria-label="District details" aria-live="polite"
            initial={reduced ? false : { opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            exit={reduced ? undefined : { opacity: 0, y: 10 }} transition={{ duration: reduced ? 0 : 0.25 }}
            className="glass pointer-events-auto rounded-panel p-6"
          >
            {info ? (
              <>
                <div className="flex items-start justify-between gap-3">
                  <h2 className="flex items-center gap-2 text-xl font-semibold">
                    <span className="size-2.5 rounded-full" style={{ background: info.color, boxShadow: `0 0 10px ${info.color}` }} />
                    {info.name}
                  </h2>
                  <button type="button" aria-label="Back to the tour" onClick={resumeScroll} className="rounded-control p-1.5 text-muted hover:bg-white/5 hover:text-ink">
                    <X size={18} />
                  </button>
                </div>
                <p className="mt-3 font-display text-lg">{info.headline}</p>
                <p className="mt-2 text-sm text-muted">{info.description}</p>
                <div className="mt-5 flex flex-wrap items-center gap-2">
                  <Link to={info.appRoute} className={buttonClass('primary')}>Explore</Link>
                  <Button variant="secondary" onClick={showOverview}>City overview</Button>
                  <div className="ml-auto flex gap-1">
                    <Button variant="ghost" aria-label="Previous district" className="px-2" onClick={() => step(-1)}><ChevronLeft size={18} /></Button>
                    <Button variant="ghost" aria-label="Next district" className="px-2" onClick={() => step(1)}><ChevronRight size={18} /></Button>
                  </div>
                </div>
              </>
            ) : (
              <>
                <h2 className="text-xl font-semibold">City overview</h2>
                <p className="mt-2 text-sm text-muted">Choose a district to fly there.</p>
                <ul className="mt-4 flex flex-col gap-1">
                  {DISTRICTS.map((d) => (
                    <li key={d.id}>
                      <button type="button" onClick={() => select(d.id)} className="flex w-full items-center gap-3 rounded-control px-3 py-2 text-left text-sm hover:bg-white/5">
                        <span className="size-2 rounded-full" style={{ background: d.color }} />{d.name}
                      </button>
                    </li>
                  ))}
                </ul>
                <Button variant="ghost" className="mt-3" onClick={resumeScroll}>Back to the tour</Button>
              </>
            )}
          </motion.aside>
        )}
      </AnimatePresence>
    </div>
  )
}
