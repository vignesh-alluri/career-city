import { useEffect, useId, useRef, type ReactNode } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ModalProps { open: boolean; onClose: () => void; title: string; size?: 'md' | 'lg'; children: ReactNode }

/**
 * Built on the native <dialog> element: the browser provides the focus trap, the Esc key and the backdrop.
 * showModal() opens it as a true modal; clicking the backdrop (the dialog element itself) closes it.
 */
export function Modal({ open, onClose, title, size = 'md', children }: ModalProps) {
  const ref = useRef<HTMLDialogElement>(null)
  const titleId = useId()

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    else if (!open && dialog.open) dialog.close()
  }, [open])

  return (
    <dialog
      ref={ref} aria-labelledby={titleId} onClose={onClose}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
      className={cn(
        'm-auto max-h-[90svh] w-[calc(100vw-2rem)] overflow-y-auto rounded-panel border border-line bg-card p-0 text-ink shadow-[0_40px_90px_-20px_rgb(0_0_0/0.95),0_0_70px_color-mix(in_srgb,var(--color-accent)_12%,transparent)] backdrop:bg-black/60 backdrop:backdrop-blur-sm',
        size === 'lg' ? 'max-w-3xl' : 'max-w-xl',
      )}
    >
      {open && (
        <div className="p-6">
          <div className="mb-5 flex items-start justify-between gap-4">
            <h2 id={titleId} className="text-xl font-semibold">{title}</h2>
            <button type="button" onClick={onClose} aria-label="Close" className="rounded-control p-1.5 text-muted hover:bg-white/5 hover:text-ink"><X size={18} /></button>
          </div>
          {children}
        </div>
      )}
    </dialog>
  )
}
