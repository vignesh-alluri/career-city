import { useId, type ComponentProps } from 'react'
import { cn } from '@/lib/utils'

interface SelectProps extends ComponentProps<'select'> { label: string; error?: string; hideLabel?: boolean }

export function Select({ label, error, hideLabel, className, children, ...props }: SelectProps) {
  const id = useId()
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className={hideLabel ? 'sr-only' : 'eyebrow'}>{label}</label>
      <select
        id={id} aria-invalid={!!error} aria-describedby={error ? `${id}-error` : undefined}
        className={cn('h-10 rounded-control border bg-surface px-3 text-sm text-ink', error ? 'border-danger' : 'border-line focus:border-accent', className)}
        {...props}
      >
        {children}
      </select>
      {error && <p id={`${id}-error`} className="text-sm text-danger">{error}</p>}
    </div>
  )
}
