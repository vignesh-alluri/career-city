export interface Segment { text: string; match: boolean }

/**
 * Cuts `text` into pieces so the parts that match `query` can be highlighted. Case does not matter, and the original spelling is kept.
 * An empty query (or text whose lower-case form changes length, which a few unusual letters do) gives one plain piece.
 */
export function splitMatch(text: string, query: string): Segment[] {
  const q = query.trim().toLowerCase()
  const lower = text.toLowerCase()
  if (!q || lower.length !== text.length) return [{ text, match: false }]
  const out: Segment[] = []
  let from = 0
  for (let i = lower.indexOf(q); i !== -1; i = lower.indexOf(q, from)) {
    if (i > from) out.push({ text: text.slice(from, i), match: false })
    out.push({ text: text.slice(i, i + q.length), match: true })
    from = i + q.length
  }
  if (from < text.length) out.push({ text: text.slice(from), match: false })
  return out.length ? out : [{ text, match: false }]
}
