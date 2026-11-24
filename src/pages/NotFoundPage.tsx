import { Link } from 'react-router-dom'
import { Compass } from 'lucide-react'
import { useAuth } from '@/auth/useAuth'

/** Shown for any address that does not exist, so a mistyped link ends somewhere helpful instead of a blank page. */
export default function NotFoundPage() {
  const { user } = useAuth()
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-void px-6 text-center text-ink">
      <Compass size={40} className="text-accent" aria-hidden />
      <h1 className="text-3xl font-semibold">This street is not on the map</h1>
      <p className="max-w-md text-sm text-muted">The page you are looking for does not exist, or it has moved.</p>
      <Link to={user ? '/app' : '/'} className="rounded-control bg-accent px-4 py-2 text-sm font-medium text-void">
        {user ? 'Back to your dashboard' : 'Back to the city'}
      </Link>
    </main>
  )
}
