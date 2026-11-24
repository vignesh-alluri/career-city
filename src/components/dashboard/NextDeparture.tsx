import { format } from 'date-fns'
import { dayLabel, type Departure } from '@/selectors/nextDeparture'

/** One slim line under "Your line": the next thing on your timetable, like the headline row of a departure board. */
export function NextDeparture({ departure, now, onOpen }: { departure: Departure; now: Date; onOpen?: () => void }) {
  const body = (
    <>
      <span className="eyebrow shrink-0">Next departure</span>
      <span className="shrink-0 font-mono text-base font-semibold tabular-nums text-amber uppercase">
        {format(departure.at, 'd MMM')}{departure.hasTime && <span className="ml-2">{format(departure.at, 'HH:mm')}</span>}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium">{departure.title}</span>
        <span className="block truncate text-xs text-muted">{departure.detail}</span>
      </span>
      <span className="shrink-0 font-mono text-xs text-muted">{dayLabel(departure.at, now)}</span>
    </>
  )
  const box = 'ticks flex w-full flex-wrap items-center gap-x-5 gap-y-1 rounded-panel border border-line bg-black/30 px-5 py-3 text-left'
  return onOpen
    ? <button type="button" onClick={onOpen} className={`${box} transition-colors hover:border-amber/50`}>{body}</button>
    : <div className={box}>{body}</div>
}
