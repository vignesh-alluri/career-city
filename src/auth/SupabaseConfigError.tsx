import { Link } from 'react-router-dom'
import { Card } from '@/components/ui/Card'

/** Shown instead of the login/app screens when the Supabase keys are missing, so the cause is obvious. */
export function SupabaseConfigError() {
  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <Card className="w-full max-w-lg" role="alert">
        <h1 className="text-xl font-semibold">Supabase is not configured</h1>
        <p className="mt-2 text-sm text-muted">
          The app cannot find its database keys. Create a file named <code className="text-ink">.env.local</code> in the
          project folder (next to <code className="text-ink">package.json</code>) containing:
        </p>
        <pre className="mt-3 overflow-x-auto rounded-control border border-line bg-surface p-3 text-xs text-ink">{`VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-public-anon-key`}</pre>
        <p className="mt-3 text-sm text-muted">Then stop the dev server (Ctrl+C) and run <code className="text-ink">npm run dev</code> again. Vite reads this file only at start-up.</p>
        <Link to="/" className="mt-4 inline-block text-sm text-accent hover:underline">Back to the city</Link>
      </Card>
    </div>
  )
}
