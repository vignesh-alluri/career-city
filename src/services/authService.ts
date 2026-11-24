import type { AuthError, User } from '@supabase/supabase-js'
import { getSupabase } from '@/lib/supabaseClient'

import type { AuthChangeEvent } from '@supabase/supabase-js'

export type AuthEvent = AuthChangeEvent

/** The only user details the app needs. Components never see Supabase's own User object. */
export interface AuthUser { id: string; email: string; displayName: string | null }

function toAuthUser(u: User): AuthUser {
  const name = u.user_metadata?.display_name
  return { id: u.id, email: u.email ?? '', displayName: typeof name === 'string' && name !== '' ? name : null }
}

/** Plain-language messages for the errors people actually hit. Anything unexpected gets a generic message and is logged. */
export function friendlyAuthError(error: AuthError): Error {
  const raw = error.message ?? ''
  if (/failed to fetch|network/i.test(raw) || error.name === 'AuthRetryableFetchError') {
    return new Error('Could not reach the server. Check your internet connection and try again.')
  }
  switch (error.code) {
    case 'invalid_credentials': return new Error('That email and password do not match. Check them and try again.')
    case 'email_not_confirmed': return new Error('Confirm your email first. We sent you a link when you registered.')
    case 'user_already_exists':
    case 'email_exists': return new Error('An account with this email already exists. Try logging in instead.')
    case 'weak_password': return new Error('Choose a stronger password with at least 8 characters.')
    case 'signup_disabled': return new Error('New registrations are turned off right now.')
    case 'over_request_rate_limit':
    case 'over_email_send_rate_limit': return new Error('Too many attempts. Wait a few minutes, then try again.')
    default:
      console.error('Auth error:', error)
      return new Error('Something went wrong. Please try again.')
  }
}

export const authService = {
  /**
   * Calls back once with the current session when you subscribe, then again on every login, logout and token refresh.
   * Keep the callback synchronous: awaiting other Supabase calls inside it can deadlock the auth client.
   */
  onAuthChange(callback: (event: AuthEvent, user: AuthUser | null) => void): () => void {
    const { data } = getSupabase().auth.onAuthStateChange((event, session) => {
      callback(event, session?.user ? toAuthUser(session.user) : null)
    })
    return () => data.subscription.unsubscribe()
  },

  async signIn(email: string, password: string): Promise<void> {
    const { error } = await getSupabase().auth.signInWithPassword({ email, password })
    if (error) throw friendlyAuthError(error)
  },

  /**
   * Returns needsEmailConfirmation = true when the project requires people to click an emailed link before they can log in.
   * That is a Supabase setting (Authentication > Sign In / Providers > Email > "Confirm email").
   */
  async signUp(email: string, password: string, displayName: string): Promise<{ needsEmailConfirmation: boolean }> {
    const { data, error } = await getSupabase().auth.signUp({
      email, password,
      options: { data: displayName ? { display_name: displayName } : {}, emailRedirectTo: `${window.location.origin}/app` },
    })
    if (error) throw friendlyAuthError(error)
    // With email confirmation on, Supabase hides whether an address is taken by returning a user with no identities.
    if (data.user && data.user.identities?.length === 0) {
      throw new Error('An account with this email already exists. Try logging in instead.')
    }
    return { needsEmailConfirmation: !data.session }
  },

  async signOut(): Promise<void> {
    const { error } = await getSupabase().auth.signOut()
    if (error) throw friendlyAuthError(error)
  },
}
