import { create } from 'zustand'
import type { ApplicationStatus } from '@/types'

export type ModalState =
  | { kind: 'none' }
  | { kind: 'create'; defaultStatus: ApplicationStatus }
  | { kind: 'edit'; id: string }
  | { kind: 'details'; id: string }
  | { kind: 'delete'; id: string }
  | { kind: 'reminder'; defaultDate?: string; applicationId?: string | null }

interface ModalStore { modal: ModalState; open: (modal: ModalState) => void; close: () => void }

/** One shared dialog for the whole app: any page can open "add application", "details", etc. without owning that UI. */
export const useModalStore = create<ModalStore>((set) => ({
  modal: { kind: 'none' },
  open: (modal) => set({ modal }),
  close: () => set({ modal: { kind: 'none' } }),
}))
