import { useCallback, useSyncExternalStore } from 'react'
import type { CityQuality } from '@/types'

/**
 * useSyncExternalStore is React's official way to read a value that lives outside React
 * (here: the browser's media-query state) and re-render when it changes.
 */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback((onChange: () => void) => {
    const mql = window.matchMedia(query)
    mql.addEventListener('change', onChange)
    return () => mql.removeEventListener('change', onChange)
  }, [query])
  return useSyncExternalStore(subscribe, () => window.matchMedia(query).matches, () => false)
}

export const useReducedMotion = () => useMediaQuery('(prefers-reduced-motion: reduce)')

export function useCityQuality(): CityQuality {
  const smallScreen = useMediaQuery('(max-width: 767px)')
  const touch = useMediaQuery('(pointer: coarse)')
  return smallScreen || touch ? 'low' : 'high'
}

/** Must match SIDE_LAYOUT_ASPECT (1.35 = 27/20) in animation/cameraRig.ts. */
export const useSideLayout = () => useMediaQuery('(min-aspect-ratio: 27/20)')
