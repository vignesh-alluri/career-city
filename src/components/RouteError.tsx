import { isRouteErrorResponse, useRouteError } from 'react-router-dom'
import { Compass } from 'lucide-react'
import { Button } from '@/components/ui/Button'

/**
 * Shown when a page cannot be shown. The usual cause after a new deployment is an old browser tab asking for a page file that no
 * longer exists (the files have new names after every build). Reloading fetches the new version, so that is what the button does.
 */
export function RouteError() {
  const error = useRouteError()
  const missing = isRouteErrorResponse(error) && error.status === 404
  return (
    <main className="grid min-h-screen place-items-center bg-void px-6 text-center text-ink">
      <div className="flex max-w-md flex-col items-center gap-4">
        <Compass size={40} className="text-accent" aria-hidden />
        <h1 className="text-2xl font-semibold">{missing ? 'This street is not on the map' : 'The line is closed for a moment'}</h1>
        <p className="text-sm text-muted">
          {missing ? 'That page does not exist.' : 'This page could not load. The site may have just been updated, or your connection dropped. Reloading usually fixes it.'}
        </p>
        <Button onClick={() => window.location.reload()}>Reload</Button>
      </div>
    </main>
  )
}
