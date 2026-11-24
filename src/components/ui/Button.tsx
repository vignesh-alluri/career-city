import type { ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

type Variant = 'primary' | 'secondary' | 'ghost'
type Size = 'md' | 'lg'

const variants: Record<Variant, string> = {
  // a ticket-machine button: it has a visible edge underneath, and pressing it pushes it down onto that edge
  primary: 'bg-accent text-void font-semibold shadow-[0_3px_0_color-mix(in_srgb,var(--color-accent)_45%,#000)] hover:brightness-110 active:translate-y-[2px] active:shadow-[0_1px_0_color-mix(in_srgb,var(--color-accent)_45%,#000)]',
  secondary: 'border border-line bg-card text-ink shadow-[0_3px_0_rgb(0_0_0/0.35)] hover:border-accent/50 active:translate-y-[2px] active:shadow-none',
  ghost: 'text-muted hover:text-ink hover:bg-white/5',
}
const sizes: Record<Size, string> = { md: 'h-10 px-4 text-sm', lg: 'h-12 px-6 text-base' }

/** Use on <Link> too, so a link can look like a button without nesting a button inside an anchor. */
export function buttonClass(variant: Variant = 'primary', size: Size = 'md', className?: string) {
  return cn(
    'relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-control transition duration-150',
    'disabled:cursor-not-allowed disabled:opacity-50',
    variants[variant], sizes[size], className,
  )
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> { variant?: Variant; size?: Size }

export function Button({ variant = 'primary', size = 'md', className, ...props }: ButtonProps) {
  return <button type="button" data-ripple={variant === 'primary' ? 'light' : 'true'} className={buttonClass(variant, size, className)} {...props} />
}
