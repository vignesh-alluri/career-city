import { create } from 'zustand'
import { scrollState } from '@/animation/cameraRig'
import type { DistrictId } from '@/types'

/** 'scroll': the page scroll position steers the camera. 'explore': a click/panel steers it. */
export type CameraMode = 'scroll' | 'explore'

interface CityState {
  mode: CameraMode
  selected: DistrictId | null   // explicitly chosen district (click, panel, rail)
  hovered: DistrictId | null
  activeSection: number         // which landing section is on screen (0 hero, 1-5 districts, 6 finale)
  select: (id: DistrictId) => void
  showOverview: () => void
  resumeScroll: () => void
  setHovered: (id: DistrictId) => void
  clearHovered: (id: DistrictId) => void
  setActiveSection: (index: number) => void
  reset: () => void
}

const initial = {
  mode: 'scroll' as CameraMode,
  selected: null as DistrictId | null,
  hovered: null as DistrictId | null,
  activeSection: 0,
}

/**
 * Zustand store: a tiny shared state container. Unlike React context, it also works across the boundary between
 * the HTML page and the <Canvas> (which is a separate React renderer). Components subscribe to just the slice
 * they need, so only they re-render when it changes.
 */
export const useCityStore = create<CityState>((set, get) => ({
  ...initial,
  select: (id) => { scrollState.exploreFrom = scrollState.progress; set({ mode: 'explore', selected: id }) },
  showOverview: () => { scrollState.exploreFrom = scrollState.progress; set({ mode: 'explore', selected: null }) },
  resumeScroll: () => set({ mode: 'scroll', selected: null }),
  setHovered: (id) => set({ hovered: id }),
  // Only clear if it is still this district: moving between districts fires "over" of the new one before "out" of the old.
  clearHovered: (id) => { if (get().hovered === id) set({ hovered: null }) },
  setActiveSection: (activeSection) => set({ activeSection }),
  reset: () => set(initial),
}))
