export type ShortcutAction =
  | 'palette' | 'new-application' | 'new-reminder' | 'focus-search' | 'help'
  | 'go:dashboard' | 'go:applications' | 'go:board' | 'go:calendar' | 'go:analytics' | 'go:city' | 'go:settings'

export interface KeyInfo { key: string; ctrlKey: boolean; metaKey: boolean; altKey: boolean }

/** After pressing "g", the next key picks where to go (like in Gmail and GitHub). */
export const GO_KEYS: Record<string, ShortcutAction> = {
  d: 'go:dashboard', a: 'go:applications', b: 'go:board', c: 'go:calendar', y: 'go:analytics', m: 'go:city', s: 'go:settings',
}

/** What the "keyboard shortcuts" dialog shows. */
export const SHORTCUT_HELP: { keys: string[]; label: string }[] = [
  { keys: ['Ctrl', 'K'], label: 'Quick find: search applications and run commands' },
  { keys: ['N'], label: 'New application' },
  { keys: ['R'], label: 'New reminder' },
  { keys: ['/'], label: 'Search your applications' },
  { keys: ['G', 'D'], label: 'Go to Dashboard' },
  { keys: ['G', 'A'], label: 'Go to Applications' },
  { keys: ['G', 'B'], label: 'Go to Board' },
  { keys: ['G', 'C'], label: 'Go to Calendar' },
  { keys: ['G', 'Y'], label: 'Go to Analytics' },
  { keys: ['G', 'M'], label: 'Go to My city' },
  { keys: ['G', 'S'], label: 'Go to Settings' },
  { keys: ['1', '2', '3'], label: 'Calendar: month, week or agenda view' },
  { keys: ['\u2190', '\u2192'], label: 'Calendar: previous or next period' },
  { keys: ['T'], label: 'Calendar: jump to today' },
  { keys: ['?'], label: 'Show this list' },
]

/**
 * Turns key presses into actions. It remembers whether "g" was just pressed, so "g" then "d" within a moment means "go to
 * the dashboard". It only decides WHAT a key means; the caller decides whether the person is typing in a box (and should be left alone).
 * `now` is passed in so tests can control time.
 */
export function createShortcutMatcher(timeoutMs = 1200) {
  let gPressedAt = -Infinity
  return (e: KeyInfo, now: number): ShortcutAction | null => {
    const key = e.key.toLowerCase()
    if ((e.ctrlKey || e.metaKey) && key === 'k') { gPressedAt = -Infinity; return 'palette' }
    if (e.ctrlKey || e.metaKey || e.altKey) return null
    if (now - gPressedAt <= timeoutMs) {
      gPressedAt = -Infinity
      const go = GO_KEYS[key]
      if (go) return go
    }
    switch (key) {
      case 'g': gPressedAt = now; return null
      case 'n': return 'new-application'
      case 'r': return 'new-reminder'
      case '/': return 'focus-search'
      case '?': return 'help'
      default: return null
    }
  }
}
