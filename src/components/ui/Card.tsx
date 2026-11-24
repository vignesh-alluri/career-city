import type { HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** Adds hover lift, a cursor glow and a click ripple. Use for cards a person points at, not for forms. */
  interactive?: boolean
}

export function Card({ className, interactive = false, ...props }: CardProps) {
  return (
    <div
      {...(interactive ? { 'data-ripple': 'true', 'data-spotlight': 'true' } : {})}
      className={cn(
        'ticks rounded-panel border border-line bg-card p-5 shadow-card',
        interactive && 'spotlight relative overflow-hidden transition duration-200 hover:-translate-y-0.5 hover:border-accent/40 hover:shadow-card-hover',
        className,
      )}
      {...props}
    />
  )
}
