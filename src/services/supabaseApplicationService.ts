import { format } from 'date-fns'
import { getSupabase } from '@/lib/supabaseClient'
import type { Database } from '@/types/database'
import type { ApplicationStatus, ReminderInput } from '@/types'
import type { ApplicationService } from './applicationService'
import { friendlyDbError, must } from './dbErrors'
import { patchToRow, toApplication, toReminder } from './mappers'

type ApplicationInsert = Database['public']['Tables']['applications']['Insert']
type ApplicationUpdate = Database['public']['Tables']['applications']['Update']
type ReminderUpdate = Database['public']['Tables']['reminders']['Update']

const db = () => getSupabase()
const today = () => format(new Date(), 'yyyy-MM-dd')

/** New cards go to the bottom of their column. Row Level Security already limits this to the signed-in user's rows. */
async function nextPosition(status: ApplicationStatus): Promise<number> {
  const { data, error } = await db().from('applications').select('board_position').eq('status', status)
    .order('board_position', { ascending: false }).limit(1)
  if (error) throw friendlyDbError(error)
  return (data?.[0]?.board_position ?? 0) + 1
}

export const supabaseApplicationService: ApplicationService = {
  async listApplications() {
    const res = await db().from('applications').select('*').order('created_at', { ascending: true })
    return must(res).map(toApplication)
  },

  async createApplication(input) {
    const row: ApplicationInsert = {
      ...patchToRow(input), company: input.company, role: input.role, board_position: await nextPosition(input.status),
    }
    // user_id is not sent: the database fills it from the logged-in session, so a client cannot create rows for someone else.
    return toApplication(must(await db().from('applications').insert(row).select().single()))
  },

  async updateApplication(id, patch) {
    const row = patchToRow(patch)
    if (patch.status) {
      const current = must(await db().from('applications').select('status').eq('id', id).maybeSingle())
      if (current.status !== patch.status) row.board_position = await nextPosition(patch.status)
    }
    return toApplication(must(await db().from('applications').update(row).eq('id', id).select().maybeSingle()))
  },

  async moveApplication(id, status) {
    const current = must(await db().from('applications').select('date_applied').eq('id', id).maybeSingle())
    const row: ApplicationUpdate = { status, board_position: await nextPosition(status) }
    // Business rule: dragging a card out of "Saved" means you have applied, so stamp today's date if none was set.
    if (status !== 'saved' && !current.date_applied) row.date_applied = today()
    return toApplication(must(await db().from('applications').update(row).eq('id', id).select().maybeSingle()))
  },

  async deleteApplication(id) {
    // The database deletes this application's reminders too (ON DELETE CASCADE).
    const { error } = await db().from('applications').delete().eq('id', id)
    if (error) throw friendlyDbError(error)
  },

  async listReminders() {
    const res = await db().from('reminders').select('*').order('due_at', { ascending: true })
    return must(res).map(toReminder)
  },

  async createReminder(input: ReminderInput) {
    const res = await db().from('reminders')
      .insert({ application_id: input.applicationId, type: input.type, title: input.title, due_at: input.dueAt })
      .select().single()
    return toReminder(must(res))
  },

  async updateReminder(id, patch) {
    const row: ReminderUpdate = {
      application_id: patch.applicationId, type: patch.type, title: patch.title, due_at: patch.dueAt, completed: patch.completed,
    }
    return toReminder(must(await db().from('reminders').update(row).eq('id', id).select().maybeSingle()))
  },

  async deleteReminder(id) {
    const { error } = await db().from('reminders').delete().eq('id', id)
    if (error) throw friendlyDbError(error)
  },
}
