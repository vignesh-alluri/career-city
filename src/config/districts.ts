import type { DistrictId } from '@/types'

export interface DistrictInfo {
  id: DistrictId
  name: string
  headline: string
  /** Short description (hover tooltip, district panel). */
  description: string
  /** Longer explanation used in the landing page story. */
  story: string
  /** Where the "Explore" button leads inside the app. */
  appRoute: string
  /** Neon colour used by the 3D district and its UI. Cyan, electric blue, magenta, orange and violet: the colours of Tokyo neon. */
  color: string
  /** Short Japanese words shown on the neon signs in the 3D district and the landing page. The first is the district's name. */
  signs: readonly string[]
}

export const DISTRICTS: readonly DistrictInfo[] = [
  { id: 'discovery', name: 'Discovery District', color: '#35D9FF', signs: ['発見', '求人', '探す'], appRoute: '/app/applications',
    headline: 'Find opportunities worth chasing.',
    description: 'Save internships you spot and keep every lead in one place until you are ready to apply.',
    story: 'Save every internship that catches your eye with its role, company, link and deadline. Decide later, without losing the lead.' },
  { id: 'application', name: 'Application District', color: '#4D7CFF', signs: ['応募', '履歴書', '提出'], appRoute: '/app/board',
    headline: 'Every application. One place.',
    description: 'Track each application on a Kanban pipeline, from applied to assessment and beyond.',
    story: 'Drag each application across a Kanban pipeline, from saved to accepted. See at a glance what is waiting, what is moving and what needs a follow-up.' },
  { id: 'interview', name: 'Interview District', color: '#FF3D9A', signs: ['面接', '日程', '準備'], appRoute: '/app/calendar',
    headline: 'Stay ready for every opportunity.',
    description: 'Keep interview schedules, reminders and preparation notes together.',
    story: 'Keep interview dates, follow-up reminders and preparation notes together, so nothing sneaks up on you.' },
  { id: 'achievement', name: 'Achievement District', color: '#FF8A3D', signs: ['内定', '合格', '実績'], appRoute: '/app/applications',
    headline: 'Every milestone counts.',
    description: 'Record offers, accepted positions and the career milestones you reach.',
    story: 'Record every offer and accepted position, and mark the milestones along the way. Progress is easier to keep going when you can see it.' },
  { id: 'analytics', name: 'Analytics District', color: '#A66BFF', signs: ['分析', '統計', '成長'], appRoute: '/app/analytics',
    headline: "See how far you've come.",
    description: 'See your application activity, conversion rates and progress over time.',
    story: 'See applications over time, how many turn into interviews and offers, and how active you have been each week.' },
]

export const DISTRICT_BY_ID = Object.fromEntries(DISTRICTS.map((d) => [d.id, d])) as Record<DistrictId, DistrictInfo>
