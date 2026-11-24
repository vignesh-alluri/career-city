import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { SupabaseConfigError } from './SupabaseConfigError'
import { useAuth } from './useAuth'

function CenteredStatus({ children }: { children: string }) {
  return <div className="flex min-h-screen items-center justify-center"><p role="status" className="text-sm text-muted">{children}</p></div>
}

/** Only allow in-app paths as a "return to" target, so a crafted link cannot bounce someone to another site. */
export function safeReturnPath(from: unknown): string {
  return typeof from === 'string' && from.startsWith('/app') ? from : '/app'
}

/** Wraps every /app screen. Logged-out visitors are sent to the login page and brought back afterwards. */
export function ProtectedRoute() {
  const { status } = useAuth()
  const location = useLocation()
  if (status === 'loading') return <CenteredStatus>Checking your session...</CenteredStatus>
  if (status === 'misconfigured') return <SupabaseConfigError />
  if (status === 'signed_out') return <Navigate to="/login" replace state={{ from: location.pathname }} />
  return <Outlet />
}

/** Wraps login and register. People who are already logged in go straight to the app. */
export function GuestRoute() {
  const { status } = useAuth()
  const location = useLocation()
  if (status === 'loading') return <CenteredStatus>Checking your session...</CenteredStatus>
  if (status === 'misconfigured') return <SupabaseConfigError />
  if (status === 'signed_in') return <Navigate to={safeReturnPath((location.state as { from?: unknown } | null)?.from)} replace />
  return <Outlet />
}
