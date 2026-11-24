import { useId, type ComponentProps } from 'react'
import { cn } from '@/lib/utils'

interface TextareaProps extends ComponentProps<'textarea'> { label: string; error?: string }

export function Textarea({ label, error, className, ...props }: TextareaProps) {
  const id = useId()
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="eyebrow">{label}</label>
      <textarea
        id={id} aria-invalid={!!error} aria-describedby={error ? `${id}-error` : undefined}
        className={cn('min-h-24 rounded-control border bg-surface px-3 py-2 text-sm text-ink placeholder:text-muted/60', error ? 'border-danger' : 'border-line focus:border-accent', className)}
        {...props}
      />
      {error && <p id={`${id}-error`} className="text-sm text-danger">{error}</p>}
    </div>
  )
}
