import { APPLICATION_STATUSES, type ApplicationStatus } from '@/types'

/** The accent colours a person can pick. Each one replaces the bright 10% of the palette (buttons, links, the active menu item). */
export const ACCENTS = {
  sky: { label: 'Sky', color: '#38bdf8' },
  violet: { label: 'Violet', color: '#a78bfa' },
  emerald: { label: 'Emerald', color: '#34d399' },
  amber: { label: 'Amber', color: '#fbbf24' },
  rose: { label: 'Rose', color: '#fb7185' },
} as const
export type AccentId = keyof typeof ACCENTS
export const ACCENT_IDS = Object.keys(ACCENTS) as AccentId[]

/**
 * The colour of the surfaces in the workspace (the landing page keeps its own look).
 *  dusk   graphite and aubergine with warm lines, so the blue accent really stands out (the default)
 *  night  the original deep blue and indigo
 */
export const PALETTES = ['dusk', 'night'] as const
export type Palette = (typeof PALETTES)[number]
/** Names and the three surface colours (page, sidebar, card), for the preview tiles in Settings. */
export const PALETTE_INFO: Record<Palette, { label: string; hint: string; swatch: [string, string, string] }> = {
  dusk: { label: 'Dusk', hint: 'Graphite and aubergine, warm lines', swatch: ['#100e13', '#1b1620', '#28212c'] },
  night: { label: 'Night blue', hint: 'The original deep blue and indigo', swatch: ['#0f172a', '#1a1d4d', '#252868'] },
}

/** How strong the ripples of the water cursor look. Each step scales the push of the cursor and how bright the ripples are drawn. */
export const WATER_STRENGTHS = ['subtle', 'normal', 'lively'] as const
export type WaterStrength = (typeof WATER_STRENGTHS)[number]
export const WATER_STRENGTH_FACTOR: Record<WaterStrength, number> = { subtle: 0.55, normal: 0.8, lively: 1 }

export type Density = 'comfortable' | 'compact'
export type CalendarView = 'month' | 'week' | 'agenda'
export const CALENDAR_VIEWS: readonly CalendarView[] = ['month', 'week', 'agenda']

/**
 * How much the 3D city is allowed to spend on looks.
 *  auto  start with everything, and switch the expensive effects off by itself if the frame rate drops
 *  full  always everything (on a computer that can take it)
 *  light always the cheaper version: no mirror reflections, smaller water
 */
export const CITY_EFFECTS = ['auto', 'full', 'light'] as const
export type CityEffects = (typeof CITY_EFFECTS)[number]

export interface DashboardSections { stats: boolean; deadlines: boolean; upcoming: boolean }

export interface Preferences {
  accent: AccentId
  palette: Palette
  density: Density
  /** 1 = weeks start on Monday, 0 = on Sunday */
  weekStartsOn: 0 | 1
  calendarView: CalendarView
  /** The glassy water ripples that follow the cursor around the workspace */
  waterCursor: boolean
  waterStrength: WaterStrength
  cityEffects: CityEffects
  dashboard: DashboardSections
  /** Board columns the person has hidden */
  boardHidden: ApplicationStatus[]
}

export const DEFAULT_PREFERENCES: Preferences = {
  accent: 'sky', palette: 'dusk', density: 'comfortable', weekStartsOn: 1, calendarView: 'month', waterCursor: true, waterStrength: 'normal', cityEffects: 'auto',
  dashboard: { stats: true, deadlines: true, upcoming: true }, boardHidden: [],
}

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v)

/**
 * Preferences come back from the browser's storage, where anything could be (an older version, a hand-edited value, nothing).
 * This checks every field and falls back to the default for any that is missing or invalid, so a bad value can never break the app.
 */
export function sanitizePreferences(raw: unknown): Preferences {
  const d = DEFAULT_PREFERENCES
  if (!isRecord(raw)) return { ...d, dashboard: { ...d.dashboard }, boardHidden: [] }
  const dash = isRecord(raw.dashboard) ? raw.dashboard : {}
  const flag = (value: unknown, fallback: boolean) => (typeof value === 'boolean' ? value : fallback)
  return {
    accent: ACCENT_IDS.includes(raw.accent as AccentId) ? (raw.accent as AccentId) : d.accent,
    palette: PALETTES.includes(raw.palette as Palette) ? (raw.palette as Palette) : d.palette,
    density: raw.density === 'compact' || raw.density === 'comfortable' ? raw.density : d.density,
    weekStartsOn: raw.weekStartsOn === 0 || raw.weekStartsOn === 1 ? raw.weekStartsOn : d.weekStartsOn,
    calendarView: CALENDAR_VIEWS.includes(raw.calendarView as CalendarView) ? (raw.calendarView as CalendarView) : d.calendarView,
    waterCursor: flag(raw.waterCursor, d.waterCursor),
    waterStrength: WATER_STRENGTHS.includes(raw.waterStrength as WaterStrength) ? (raw.waterStrength as WaterStrength) : d.waterStrength,
    cityEffects: CITY_EFFECTS.includes(raw.cityEffects as CityEffects) ? (raw.cityEffects as CityEffects) : d.cityEffects,
    dashboard: { stats: flag(dash.stats, true), deadlines: flag(dash.deadlines, true), upcoming: flag(dash.upcoming, true) },
    boardHidden: Array.isArray(raw.boardHidden)
      ? [...new Set(raw.boardHidden.filter((s): s is ApplicationStatus => APPLICATION_STATUSES.includes(s as ApplicationStatus)))]
      : [],
  }
}
