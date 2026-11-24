import { QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from 'react-router-dom'
import { AuthProvider } from '@/auth/AuthProvider'
import { queryClient } from '@/lib/queryClient'
import { router } from '@/routes'

// App stays tiny on purpose: it only wires up providers (server-data cache, auth, router).
export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </QueryClientProvider>
  )
}
