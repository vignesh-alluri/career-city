import { describe, expect, it } from 'vitest'
import { makeApplication, makeReminder } from '@/test/factories'
import { applicationsToCsv, csvCell, remindersToCsv, toCsv } from './csv'

describe('csvCell', () => {
  it('leaves plain text alone and turns empty values into nothing', () => {
    expect(csvCell('Acme')).toBe('Acme')
    expect(csvCell(null)).toBe('')
    expect(csvCell(undefined)).toBe('')
    expect(csvCell(0)).toBe('0')
  })

  it('wraps values with commas, quotes or line breaks, and doubles inner quotes', () => {
    expect(csvCell('Tokyo, Japan')).toBe('"Tokyo, Japan"')
    expect(csvCell('say "hi"')).toBe('"say ""hi"""')
    expect(csvCell('line one\nline two')).toBe('"line one\nline two"')
  })

  it('defuses spreadsheet formulas', () => {
    expect(csvCell('=HYPERLINK("http://evil")')).toBe('"\'=HYPERLINK(""http://evil"")"')
    expect(csvCell('+1 555')).toBe("'+1 555")
    expect(csvCell('-5')).toBe("'-5")
    expect(csvCell('@cmd')).toBe("'@cmd")
    expect(csvCell('a=b')).toBe('a=b') // only a LEADING symbol makes a formula
  })
})

describe('toCsv', () => {
  it('starts with a byte-order mark and uses CRLF line endings', () => {
    const csv = toCsv(['A', 'B'], [['1', '2']])
    expect(csv).toBe('\uFEFFA,B\r\n1,2\r\n')
  })
})

describe('applicationsToCsv', () => {
  it('writes one row per application with readable labels', () => {
    const csv = applicationsToCsv([makeApplication({ company: 'Sony, Inc', role: 'Intern', status: 'applied', employmentType: 'placement', dateApplied: '2026-03-01' })])
    const lines = csv.replace('\uFEFF', '').trim().split('\r\n')
    expect(lines).toHaveLength(2)
    expect(lines[0].startsWith('Company,Role,Status')).toBe(true)
    expect(lines[1].startsWith('"Sony, Inc",Intern,Applied,Placement year,,2026-03-01')).toBe(true)
  })

  it('exports just the header when there is nothing', () => {
    expect(applicationsToCsv([]).trim().split('\r\n')).toHaveLength(1)
  })
})

describe('remindersToCsv', () => {
  it('names the linked application, and leaves it blank when there is none', () => {
    const app = makeApplication({ company: 'Acme', role: 'Dev' })
    const csv = remindersToCsv([makeReminder({ applicationId: app.id, type: 'interview', completed: true }), makeReminder()], [app])
    const lines = csv.replace('\uFEFF', '').trim().split('\r\n')
    expect(lines[1]).toContain('Interview')
    expect(lines[1]).toContain('yes')
    expect(lines[1]).toContain('Acme - Dev')
    expect(lines[2].endsWith(',no,')).toBe(true)
  })
})
