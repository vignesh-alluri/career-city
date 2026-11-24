import { useCityStore } from '@/store/cityStore'

/** Smoothly scrolls to a landing section (0 = hero, 1-5 = districts, 6 = final call to action). */
export function scrollToSection(index: number, reducedMotion: boolean) {
  useCityStore.getState().resumeScroll()
  document.querySelectorAll('[data-section]')[index]?.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' })
}
