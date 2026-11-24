import { useEffect } from 'react'
import { usePreferences } from '@/store/preferencesStore'

/** Writes the chosen accent and density onto the page, where the CSS in globals.css picks them up. */
export function useApplyPreferences() {
  const accent = usePreferences((s) => s.accent)
  const density = usePreferences((s) => s.density)
  useEffect(() => {
    document.documentElement.dataset.accent = accent
    document.documentElement.dataset.density = density
  }, [accent, density])
}
