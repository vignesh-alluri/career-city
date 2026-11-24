export interface PaletteItem { id: string; label: string; group: string; hint?: string; keywords?: string }

const norm = (s: string) => s.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
const isSubsequence = (needle: string, hay: string) => { let i = 0; for (const c of hay) if (c === needle[i]) i++; return i === needle.length }

/**
 * How well an item matches what was typed (0 = not at all). Every word typed must match something. A word that starts the
 * label scores most, then one that starts a word inside the label, then one found anywhere in it, then in the hidden keywords.
 * As a last resort a word of 3+ letters may match as scattered letters ("tdy" finds "Today").
 */
export function scoreItem(query: string, item: PaletteItem): number {
  const words = norm(query).split(/\s+/).filter(Boolean)
  if (words.length === 0) return 1
  const label = norm(item.label)
  const rest = norm(`${item.keywords ?? ''} ${item.hint ?? ''} ${item.group}`)
  let total = 0
  for (const w of words) {
    let s = 0
    if (label.startsWith(w)) s = 6
    else if (label.split(/[\s\-:,.·]+/).some((part) => part.startsWith(w))) s = 4
    else if (label.includes(w)) s = 2
    else if (rest.includes(w)) s = 1.5
    else if (w.length >= 3 && isSubsequence(w, label)) s = 0.5
    if (s === 0) return 0
    total += s
  }
  return total
}

/** The best matches first. With nothing typed, the items stay in the order they were given. */
export function rankItems<T extends PaletteItem>(query: string, items: readonly T[], limit = 12): T[] {
  return items
    .map((item, index) => ({ item, index, score: scoreItem(query, item) }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .slice(0, limit)
    .map((x) => x.item)
}
