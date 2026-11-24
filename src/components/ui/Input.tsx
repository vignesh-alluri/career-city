import { useId, type ComponentProps } from 'react'
import { cn } from '@/lib/utils'

interface InputProps extends ComponentProps<'input'> { label: string; error?: string }

export function Input({ label, error, className, ...props }: InputProps) {
  const id = useId() // unique id links <label> to <input> for screen readers
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="eyebrow">{label}</label>
      <input
        id={id}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : undefined}
        className={cn(
          'h-10 rounded-control border bg-surface px-3 text-sm text-ink placeholder:text-muted/60',
          error ? 'border-danger' : 'border-line focus:border-accent', className,
        )}
        {...props}
      />
      {error && <p id={`${id}-error`} className="text-sm text-danger">{error}</p>}
    </div>
  )
}
