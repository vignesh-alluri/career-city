import type { ReactNode } from 'react'
import { platformNumber, type AppNavItem } from '@/config/appNav'
import { TrainGlyph } from './Train'

/**
 * The top of every workspace page: a platform sign (its number is the page's station on the sidebar line), the title, and a
 * rail with sleepers along which a small train runs once each time the page opens.
 */
export function PageHeader({ id, title, description, actions }: { id: AppNavItem['id']; title: string; description?: ReactNode; actions?: ReactNode }) {
  const n = platformNumber(id)
  return (
    <header className="flex flex-col gap-3">
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
        <div className="min-w-0">
          <p className="eyebrow flex items-center gap-2.5">
            <span aria-hidden className="flex h-5 min-w-5 items-center justify-center rounded-[3px] border-2 border-signal px-1 font-mono text-[11px] font-bold text-signal shadow-[0_0_8px_color-mix(in_srgb,var(--color-signal)_45%,transparent)]">{n}</span>
            Platform {n}
          </p>
          <h1 className="mt-2 text-4xl leading-none font-semibold">{title}</h1>
          {description && <p className="mt-2 max-w-prose text-sm text-muted">{description}</p>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
      <div aria-hidden className="rail overflow-hidden"><span className="train-run"><TrainGlyph cars={4} /></span></div>
    </header>
  )
}
