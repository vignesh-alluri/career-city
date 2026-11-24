import type { ApplicationService } from './applicationService'
import { supabaseApplicationService } from './supabaseApplicationService'

/** The one line that decides where data lives. Screens only ever see the ApplicationService interface. */
export const applicationService: ApplicationService = supabaseApplicationService
export { authService } from './authService'
export type { AuthUser, AuthEvent } from './authService'
