import type { DistrictId } from '@/types'

/** A small decorative illustration under each district's story text, different for every district. */
export function DistrictMotif({ id, color }: { id: DistrictId; color: string }) {
  switch (id) {
    case 'discovery':
      return (
        <ul className="mt-6 flex flex-wrap gap-2 text-sm">
          {['Save roles', 'Add links', 'Track deadlines'].map((t) => (
            <li key={t} className="rounded-full border px-3 py-1" style={{ borderColor: color }}>{t}</li>
          ))}
        </ul>
      )
    case 'application':
      return (
        <div aria-hidden className="mt-6 flex gap-2">
          {['Saved', 'Applied', 'Interview', 'Offered'].map((c) => (
            <div key={c} className="w-[4.5rem] rounded-control border border-line bg-card/70 p-2">
              <div className="text-xs text-muted">{c}</div>
              <div className="mt-2 h-5 rounded-sm" style={{ background: color, opacity: 0.3 }} />
              <div className="mt-1.5 h-5 rounded-sm bg-white/5" />
            </div>
          ))}
        </div>
      )
    case 'interview':
      return (
        <ul className="mt-6 flex flex-col gap-3 text-sm">
          {['Interview schedule', 'Follow-up reminders', 'Preparation notes'].map((t) => (
            <li key={t} className="flex items-center gap-3">
              <span className="size-2 rounded-full" style={{ background: color, boxShadow: `0 0 8px ${color}` }} />{t}
            </li>
          ))}
        </ul>
      )
    case 'achievement':
      return (
        <div className="mt-6 flex items-center gap-3 text-sm">
          <span className="size-3 rounded-full border-2" style={{ borderColor: color }} /> Offer
          <span className="h-px w-10" style={{ background: color }} />
          <span className="size-3 rounded-full" style={{ background: color }} /> Accepted
          <span className="h-px w-10" style={{ background: color, opacity: 0.4 }} />
          <span className="size-3 rounded-full border-2" style={{ borderColor: color, opacity: 0.4 }} />
        </div>
      )
    case 'analytics':
      return (
        <svg aria-hidden width="132" height="56" viewBox="0 0 132 56" className="mt-6">
          {[14, 24, 20, 34, 48].map((h, i) => (
            <rect key={i} x={i * 28} y={56 - h} width={20} height={h} rx={3} fill={color} opacity={0.35 + i * 0.13} />
          ))}
        </svg>
      )
  }
}
