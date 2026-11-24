import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { DEFAULT_PREFERENCES, sanitizePreferences, type Preferences } from '@/lib/preferences'

interface PreferencesStore extends Preferences {
  update: (patch: Partial<Preferences>) => void
  reset: () => void
}

/**
 * Personal settings, kept in this browser (localStorage) so they survive a refresh. Whatever is read back is checked by
 * sanitizePreferences first, so a stale or damaged value can never break the app.
 */
export const usePreferences = create<PreferencesStore>()(
  persist(
    (set) => ({
      ...DEFAULT_PREFERENCES,
      update: (patch) => set(patch),
      reset: () => set(sanitizePreferences(null)),
    }),
    {
      name: 'career-city-preferences',
      version: 1,
      partialize: (s): Preferences => ({
        accent: s.accent, palette: s.palette, density: s.density, weekStartsOn: s.weekStartsOn, calendarView: s.calendarView,
        waterCursor: s.waterCursor, waterStrength: s.waterStrength, cityEffects: s.cityEffects, dashboard: s.dashboard, boardHidden: s.boardHidden,
      }),
      merge: (persisted, current) => ({ ...current, ...sanitizePreferences(persisted) }),
    },
  ),
)
