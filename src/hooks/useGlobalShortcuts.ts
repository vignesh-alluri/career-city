import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { NAV_PATH, type AppNavItem } from '@/config/appNav'
import { createShortcutMatcher } from '@/lib/shortcuts'
import { useModalStore } from '@/store/modalStore'
import { useUiStore } from '@/store/uiStore'

const isTyping = (el: EventTarget | null) => {
  const t = el as HTMLElement | null
  return !!t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable)
}

/**
 * Keyboard shortcuts for the whole workspace. They stay out of the way: nothing fires while you are typing in a box or while a
 * dialog is open. The one exception is Ctrl+K (quick find), which is meant to work from anywhere.
 */
export function useGlobalShortcuts() {
  const navigate = useNavigate()
  const openModal = useModalStore((s) => s.open)
  const openPalette = useUiStore((s) => s.openPalette)
  const openHelp = useUiStore((s) => s.openHelp)

  useEffect(() => {
    const match = createShortcutMatcher()
    const onKey = (e: KeyboardEvent) => {
      const wantsPalette = (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k'
      if (!wantsPalette && (isTyping(e.target) || document.querySelector('dialog[open]'))) return
      const action = match(e, performance.now())
      if (!action) return
      e.preventDefault()
      if (action.startsWith('go:')) { navigate(NAV_PATH[action.slice(3) as AppNavItem['id']]); return }
      switch (action) {
        case 'palette': openPalette(); break
        case 'help': openHelp(); break
        case 'new-application': openModal({ kind: 'create', defaultStatus: 'saved' }); break
        case 'new-reminder': openModal({ kind: 'reminder' }); break
        case 'focus-search': {
          const box = document.querySelector<HTMLInputElement>('[data-app-search]')
          if (box) box.focus(); else navigate('/app/applications', { state: { focusSearch: true } })
          break
        }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [navigate, openModal, openPalette, openHelp])
}
