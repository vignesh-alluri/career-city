import { Briefcase, Building2, Calendar, Columns3, LayoutDashboard, Settings, TrendingUp, type LucideIcon } from 'lucide-react'

export interface AppNavItem { id: 'dashboard' | 'applications' | 'board' | 'calendar' | 'analytics' | 'city' | 'settings'; to: string; label: string; icon: LucideIcon; end?: boolean; keywords: string }

/** Every place in the workspace. The sidebar, the quick-find box and the "g then letter" shortcuts all read this one list. */
export const APP_NAV: readonly AppNavItem[] = [
  { id: 'dashboard', to: '/app', label: 'Dashboard', icon: LayoutDashboard, end: true, keywords: 'home overview stats' },
  { id: 'applications', to: '/app/applications', label: 'Applications', icon: Briefcase, keywords: 'list search internships' },
  { id: 'board', to: '/app/board', label: 'Board', icon: Columns3, keywords: 'kanban columns drag' },
  { id: 'calendar', to: '/app/calendar', label: 'Calendar', icon: Calendar, keywords: 'deadlines interviews schedule reminders' },
  { id: 'analytics', to: '/app/analytics', label: 'Analytics', icon: TrendingUp, keywords: 'charts rates funnel' },
  { id: 'city', to: '/app/city', label: 'My city', icon: Building2, keywords: '3d buildings map' },
  { id: 'settings', to: '/app/settings', label: 'Settings', icon: Settings, keywords: 'preferences theme accent colour density customise' },
]

export const NAV_PATH: Record<AppNavItem['id'], string> = Object.fromEntries(APP_NAV.map((n) => [n.id, n.to])) as Record<AppNavItem['id'], string>

/**
 * Which sidebar station is lit for an address, as an index into APP_NAV (-1 when none match).
 * "Dashboard" is /app exactly (it has `end: true`); the others match their own address and anything below it.
 */
export function activeNavIndex(pathname: string): number {
  const clean = pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname
  return APP_NAV.findIndex((n) => (n.end ? clean === n.to : clean === n.to || clean.startsWith(`${n.to}/`)))
}

/** The platform number shown for a page: its position in the sidebar, counting from 1. */
export function platformNumber(id: AppNavItem['id']): number {
  return APP_NAV.findIndex((n) => n.id === id) + 1
}
