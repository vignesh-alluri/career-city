import { Modal } from '@/components/ui/Modal'
import { SHORTCUT_HELP } from '@/lib/shortcuts'
import { useUiStore } from '@/store/uiStore'

/** The list of keyboard shortcuts, opened with "?" or from quick find. */
export function ShortcutHelp() {
  const open = useUiStore((s) => s.helpOpen)
  const close = useUiStore((s) => s.closeHelp)
  return (
    <Modal open={open} onClose={close} title="Keyboard shortcuts">
      <ul className="flex flex-col divide-y divide-line">
        {SHORTCUT_HELP.map((s) => (
          <li key={s.label} className="flex items-center justify-between gap-4 py-2 text-sm">
            <span className="text-muted">{s.label}</span>
            <span className="flex shrink-0 gap-1">
              {s.keys.map((k, i) => <kbd key={i} className="min-w-6 rounded border border-line bg-surface px-1.5 py-0.5 text-center font-mono text-xs">{k}</kbd>)}
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-4 text-xs text-muted">Shortcuts never fire while you are typing in a box or while a dialog is open.</p>
    </Modal>
  )
}
