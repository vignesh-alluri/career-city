import { useLayoutEffect, type RefObject } from 'react'
import { useCityStore } from '@/store/cityStore'
import { scrollState } from './cameraRig'
import { gsap, ScrollTrigger } from './gsap'

/**
 * Connects page scrolling to the city:
 *  1. one ScrollTrigger over the whole page writes progress (0..1) into `scrollState` (no React re-render);
 *  2. one ScrollTrigger per section tells the store which section is on screen (a rare, discrete update).
 * gsap.context collects every trigger created inside it, so revert() cleans them all up when we leave the page.
 */
export function useLandingScroll(container: RefObject<HTMLElement | null>) {
  useLayoutEffect(() => {
    const el = container.current
    if (!el) return
    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: el, start: 'top top', end: 'bottom bottom',
        onRefresh: (self) => { scrollState.progress = self.progress },
        onUpdate: (self) => {
          scrollState.progress = self.progress
          const { mode, resumeScroll } = useCityStore.getState()
          // Scrolling while exploring a district hands control back to the scroll tour.
          if (mode === 'explore' && Math.abs(self.progress - scrollState.exploreFrom) > 0.004) resumeScroll()
        },
      })
      el.querySelectorAll<HTMLElement>('[data-section]').forEach((section, index) => {
        ScrollTrigger.create({
          trigger: section, start: 'top 60%', end: 'bottom 60%',
          onToggle: (self) => { if (self.isActive) useCityStore.getState().setActiveSection(index) },
        })
      })
    }, el)
    return () => { ctx.revert(); scrollState.progress = 0 }
  }, [container])
}
