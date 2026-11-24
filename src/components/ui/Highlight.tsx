import { splitMatch } from '@/lib/highlight'

/** Text with the part that matches the search wrapped in a soft lamplight highlight. */
export function Highlight({ text, query }: { text: string; query: string }) {
  return <>{splitMatch(text, query).map((s, i) => (s.match ? <mark key={i} className="rounded-[2px] bg-ember/30 text-inherit">{s.text}</mark> : <span key={i}>{s.text}</span>))}</>
}
