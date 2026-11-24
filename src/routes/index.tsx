import type { ComponentType } from 'react'
import { createBrowserRouter } from 'react-router-dom'
import LandingPage from '@/pages/landing/LandingPage'
import NotFoundPage from '@/pages/NotFoundPage'
import { BootScreen } from '@/components/BootScreen'
import { RouteError } from '@/components/RouteError'
import { GuestRoute, ProtectedRoute } from '@/auth/RouteGuards'

/**
 * Code splitting: every page except the landing page is downloaded only when someone opens it. That keeps the first download small
 * (a visitor who only looks at the landing page never fetches the charts, the drag-and-drop code or the forms). Each `lazy` below
 * is a function that imports the page the first time the route is needed. The landing page stays in the main file because it is the
 * first thing most visitors see.
 *
 * Route guards are layout routes: they render <Outlet /> (the child page) only when the visitor is allowed in.
 * - GuestRoute: login/register, bounces logged-in people to the app.
 * - ProtectedRoute: everything under /app, bounces logged-out visitors to /login.
 * These guards are a convenience for the user. The real protection is Row Level Security in the database.
 */
const page = <T extends { default: ComponentType }>(load: () => Promise<T>) => async () => ({ Component: (await load()).default })

export const router = createBrowserRouter([
  {
    // a wrapper with no page of its own: it supplies the loading screen and the error page for everything below
    HydrateFallback: BootScreen,
    ErrorBoundary: RouteError,
    children: [
      { path: '/', element: <LandingPage /> },
      {
        element: <GuestRoute />,
        children: [
          { path: '/login', lazy: page(() => import('@/pages/auth/LoginPage')) },
          { path: '/register', lazy: page(() => import('@/pages/auth/RegisterPage')) },
        ],
      },
      {
        path: '/app',
        element: <ProtectedRoute />,
        children: [
          {
            lazy: async () => ({ Component: (await import('@/components/layout/AppShell')).AppShell }),
            children: [
              { index: true, lazy: page(() => import('@/pages/app/DashboardPage')) },
              { path: 'applications', lazy: page(() => import('@/pages/app/ApplicationsPage')) },
              { path: 'board', lazy: page(() => import('@/pages/app/BoardPage')) },
              { path: 'calendar', lazy: page(() => import('@/pages/app/CalendarPage')) },
              { path: 'analytics', lazy: page(() => import('@/pages/app/AnalyticsPage')) },
              { path: 'settings', lazy: page(() => import('@/pages/app/SettingsPage')) },
              // the page (and with it Three.js) is downloaded only when someone opens My city
              { path: 'city', lazy: page(() => import('@/pages/app/MyCityPage')) },
            ],
          },
        ],
      },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])
