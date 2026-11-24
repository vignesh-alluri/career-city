import { createContext } from 'react'
import type { AuthUser } from '@/services'

/**
 * loading: still checking for a saved session.   signed_in / signed_out: self-explanatory.
 * misconfigured: the Supabase keys are missing from .env.local.
 */
export type AuthStatus = 'loading' | 'signed_in' | 'signed_out' | 'misconfigured'

export interface AuthContextValue {
  status: AuthStatus
  user: AuthUser | null
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, displayName: string) => Promise<{ needsEmailConfirmation: boolean }>
  signOut: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)
