import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { usePreferences } from '@/store/preferencesStore'
import { Card } from '@/components/ui/Card'
import { TrainGlyph } from '@/components/ui/Train'

/** Shared frame for the login and register screens: a boarding pass, with a train that runs along the rail above it once. */
export function AuthLayout({ title, subtitle, children, footer }: { title: string; subtitle: string; children: ReactNode; footer: ReactNode }) {
  const palette = usePreferences((s) => s.palette)
  return (
    <div data-palette={palette} className="app-shell relative flex min-h-screen flex-col items-center justify-center gap-6 p-6">
      <div aria-hidden className="app-glow" />
      <Link to="/" className="relative z-10 font-display text-lg font-semibold tracking-tight">CAREER <span className="text-accent neon-text">CITY</span></Link>
      <div className="relative z-10 w-full max-w-sm">
        <div aria-hidden className="rail mb-1 overflow-hidden"><span className="train-run"><TrainGlyph cars={4} /></span></div>
        <Card>
          <p className="eyebrow flex items-center gap-2.5">
            <span aria-hidden className="flex h-5 min-w-5 items-center justify-center rounded-[3px] border-2 border-signal px-1 font-mono text-[11px] font-bold text-signal">&rarr;</span>
            Boarding pass
          </p>
          <h1 className="mt-3 text-3xl leading-none font-semibold">{title}</h1>
          <p className="mt-2 text-sm text-muted">{subtitle}</p>
          <div className="mt-6">{children}</div>
        </Card>
      </div>
      <p className="relative z-10 text-sm text-muted">{footer}</p>
    </div>
  )
}
