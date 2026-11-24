/** The shape of an error returned by Supabase's database client (it is a plain object, not an Error instance). */
export interface DbError { message: string; code?: string }

/**
 * Turns a database error into an Error with a message a person can act on.
 * The UI only ever shows `error.message`, so raw Postgres wording never reaches the screen.
 */
export function friendlyDbError(error: DbError): Error {
  const raw = error.message ?? ''
  if (/failed to fetch|networkerror|network request failed/i.test(raw)) {
    return new Error('Could not reach the server. Check your internet connection and try again.')
  }
  if (/jwt expired|invalid jwt|jwt/i.test(raw) || error.code === 'PGRST301') {
    return new Error('Your session has expired. Please log in again.')
  }
  switch (error.code) {
    case '42501': return new Error('You do not have permission to do that.')
    case '23514': return new Error('Some of the values you entered are not allowed. Check the form and try again.')
    case '23503': return new Error('The linked application no longer exists.')
    case 'PGRST116': return new Error('This item no longer exists.')
    default: return new Error('Something went wrong while talking to the database. Please try again.')
  }
}

/**
 * Unwraps a Supabase result: returns the data, or throws a friendly Error.
 * NonNullable<T> tells TypeScript that after this call the value can no longer be null,
 * which is why callers can use `current.status` without a separate null check.
 */
export function must<T>(res: { data: T; error: DbError | null }): NonNullable<T> {
  if (res.error) {
    console.error('Database error:', res.error)
    throw friendlyDbError(res.error)
  }
  if (res.data === null || res.data === undefined) throw new Error('This item no longer exists.')
  return res.data as NonNullable<T>
}
