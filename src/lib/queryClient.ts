import { QueryClient } from '@tanstack/react-query'

/**
 * TanStack Query keeps a cache of server data and tells components when it is loading, failed or stale.
 * One automatic retry covers a brief network blip; after that the error is shown with a "Try again" button.
 */
export const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } },
})
