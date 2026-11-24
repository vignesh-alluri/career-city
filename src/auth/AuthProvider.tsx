import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { isSupabaseConfigured } from '@/lib/supabaseClient'
import { queryClient } from '@/lib/queryClient'
import { authService, type AuthUser } from '@/services'
import { AuthContext, type AuthContextValue, type AuthStatus } from './authContext'

interface State { status: AuthStatus; user: AuthUser | null }

const sameUser = (a: AuthUser | null, b: AuthUser | null) =>
  a?.id === b?.id && a?.email === b?.email && a?.displayName === b?.displayName

/**
 * Holds "who is logged in" for the whole app. Supabase keeps the session in the browser and refreshes it;
 * we only listen for changes and mirror them into React state.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State>(
    isSupabaseConfigured ? { status: 'loading', user: null } : { status: 'misconfigured', user: null },
  )

  useEffect(() => {
    if (!isSupabaseConfigured) return
    let lastUserId: string | null = null
    return authService.onAuthChange((event, user) => {
      // Never let one person's cached data appear for another: wipe the cache on logout or when the user changes.
      if (event === 'SIGNED_OUT' || (user && lastUserId && user.id !== lastUserId)) queryClient.clear()
      lastUserId = user?.id ?? null
      setState((prev) => {
        if (!user) return prev.status === 'signed_out' ? prev : { status: 'signed_out', user: null }
        return prev.status === 'signed_in' && sameUser(prev.user, user) ? prev : { status: 'signed_in', user }
      })
    })
  }, [])

  const value = useMemo<AuthContextValue>(() => ({
    ...state,
    signIn: (email, password) => authService.signIn(email, password),
    signUp: (email, password, displayName) => authService.signUp(email, password, displayName),
    signOut: () => authService.signOut(),
  }), [state])

  return <AuthContext value={value}>{children}</AuthContext>
}
