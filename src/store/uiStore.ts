import { create } from 'zustand'

interface UiStore {
  paletteOpen: boolean
  helpOpen: boolean
  openPalette: () => void
  closePalette: () => void
  openHelp: () => void
  closeHelp: () => void
}

/** Open/closed state of the quick-find box and the shortcuts list, so the keyboard, the sidebar button and the menu can all open them. */
export const useUiStore = create<UiStore>((set) => ({
  paletteOpen: false,
  helpOpen: false,
  openPalette: () => set({ paletteOpen: true, helpOpen: false }),
  closePalette: () => set({ paletteOpen: false }),
  openHelp: () => set({ helpOpen: true, paletteOpen: false }),
  closeHelp: () => set({ helpOpen: false }),
}))
