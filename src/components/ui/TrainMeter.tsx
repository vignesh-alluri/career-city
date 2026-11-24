import type { CSSProperties } from 'react'
import { litCars } from '@/lib/meter'
import { cn } from '@/lib/utils'

/**
 * A rate drawn as a train: ten cars, and the first few have their windows lit. The cars roll in one after another.
 * It repeats what the number beside it already says, so it is hidden from screen readers.
 */
export function TrainMeter({ rate, total = 10, tone = 'green', className }: { rate: number | null; total?: number; tone?: 'green' | 'ember'; className?: string }) {
  const lit = litCars(rate, total)
  return (
    <div aria-hidden className={cn('flex gap-[3px]', className)}>
      {Array.from({ length: total }, (_, i) => (
        <span
          key={i} style={{ '--d': `${i * 55}ms` } as CSSProperties}
          className={cn(
            'arrive relative h-5 flex-1 rounded-[3px] border',
            i < lit ? (tone === 'green' ? 'border-signal/70 bg-signal/15 shadow-[0_0_10px_-2px_var(--color-signal)]' : 'border-ember/70 bg-ember/15 shadow-[0_0_10px_-2px_var(--color-ember)]') : 'border-white/10 bg-white/[0.03]',
            i === total - 1 && 'rounded-r-[8px]',
          )}
        >
          <span className={cn('absolute inset-x-[3px] top-[5px] h-[3px] rounded-full', i < lit ? 'bg-[#fff2cc] shadow-[0_0_6px_#fff2cc]' : 'bg-white/10')} />
        </span>
      ))}
    </div>
  )
}
