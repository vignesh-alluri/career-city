import type { ReactNode } from 'react'
import { Button } from './Button'
import { TrainGlyph } from './Train'

interface QueryLike { isPending: boolean; isError: boolean; error: unknown; refetch: () => unknown }

/** Shows a loading message or an error with a retry button until every query has succeeded, then renders the page. */
export function DataGate({ queries, children }: { queries: QueryLike[]; children: () => ReactNode }) {
  const failed = queries.find((q) => q.isError)
  if (failed) {
    const message = failed.error instanceof Error ? failed.error.message : 'Something went wrong while loading your data.'
    return (
      <div role="alert" className="flex flex-col items-start gap-3 rounded-panel border border-danger/40 bg-danger/5 p-5">
        <p className="font-medium">We couldn't load your data</p>
        <p className="text-sm text-muted">{message}</p>
        <Button variant="secondary" onClick={() => queries.forEach((q) => q.refetch())}>Try again</Button>
      </div>
    )
  }
  if (queries.some((q) => q.isPending)) {
    return (
      <div role="status" className="flex flex-col gap-2 py-6">
        <div aria-hidden className="rail w-64 max-w-full overflow-hidden"><span className="train-loop"><TrainGlyph cars={3} /></span></div>
        <p className="eyebrow">Boarding...</p>
      </div>
    )
  }
  return <>{children()}</>
}
