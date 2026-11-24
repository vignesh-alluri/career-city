/** The id with the highest count (the first one when tied), or null when every count is zero. */
export function busiest(counts: Record<string, number>, ids: string[]): { id: string; count: number } | null {
  let best: { id: string; count: number } | null = null
  for (const id of ids) {
    const count = counts[id] ?? 0
    if (count > 0 && (!best || count > best.count)) best = { id, count }
  }
  return best
}
