import type { ReactNode } from 'react'
import { TrainGlyph } from './Train'

/** Nothing here yet: a train waiting on an empty rail, then what to do about it. */
export function EmptyState({ title, description, action }: { title: string; description: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-panel border border-dashed border-ember/30 px-6 py-14 text-center">
      <div aria-hidden className="rail w-52 max-w-full"><span className="absolute top-[0.18rem] left-1/2 -translate-x-1/2"><TrainGlyph cars={3} /></span></div>
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="max-w-md text-sm text-muted">{description}</p>
      {action}
    </div>
  )
}
