import { EMPLOYMENT_LABELS, REMINDER_LABELS, STATUS_LABELS, type Application, type Reminder } from '@/types'

/**
 * Makes one value safe to put in a CSV file.
 * 1. Spreadsheet programs treat a cell that starts with = + - @ as a FORMULA. Someone could type "=HYPERLINK(...)" as a company
 *    name, export, and attack whoever opens the file ("CSV injection"). A leading apostrophe makes the program treat it as plain text.
 * 2. A value containing a comma, quote or line break must be wrapped in quotes, with any quote inside doubled ("" ).
 */
export function csvCell(value: string | number | boolean | null | undefined): string {
  if (value === null || value === undefined) return ''
  let text = String(value)
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

/**
 * Turns a header row and data rows into CSV text. Lines end in \r\n (the CSV standard) and the file starts with a byte-order
 * mark, which is what makes Excel on Windows read accented letters and Japanese text correctly instead of garbling them.
 */
export function toCsv(headers: string[], rows: (string | number | boolean | null | undefined)[][]): string {
  return '\uFEFF' + [headers, ...rows].map((row) => row.map(csvCell).join(',')).join('\r\n') + '\r\n'
}

export function applicationsToCsv(apps: Application[]): string {
  return toCsv(
    ['Company', 'Role', 'Status', 'Type', 'Location', 'Date applied', 'Deadline', 'Website', 'Application link', 'Notes', 'Job description'],
    apps.map((a) => [
      a.company, a.role, STATUS_LABELS[a.status], EMPLOYMENT_LABELS[a.employmentType], a.location, a.dateApplied, a.deadline,
      a.companyWebsite, a.applicationUrl, a.notes, a.jobDescription,
    ]),
  )
}

export function remindersToCsv(reminders: Reminder[], apps: Application[]): string {
  const company = new Map(apps.map((a) => [a.id, `${a.company} - ${a.role}`]))
  return toCsv(
    ['Title', 'Type', 'Due (UTC)', 'Done', 'Application'],
    reminders.map((r) => [r.title, REMINDER_LABELS[r.type], r.dueAt, r.completed ? 'yes' : 'no', r.applicationId ? company.get(r.applicationId) ?? '' : '']),
  )
}

/** Starts a browser download of text. The only part of this file that touches the browser, so it is not unit tested. */
export function downloadText(filename: string, text: string): void {
  const url = URL.createObjectURL(new Blob([text], { type: 'text/csv;charset=utf-8' }))
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}
