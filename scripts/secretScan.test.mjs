import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { checkFileName, checkGitignore, decodeJwtPayload, isScannable, redact, scanText } from './secretScan.mjs'

// Fixtures are assembled from pieces, so this test file never contains a string that looks like a real secret.
const b64url = (obj) => Buffer.from(JSON.stringify(obj)).toString('base64url')
const jwt = (payload) => `${b64url({ alg: 'HS256', typ: 'JWT' })}.${b64url(payload)}.${'s'.repeat(20)}`
const secretKey = 'sb_' + 'secret_' + 'a1B2c3D4e5F6g7H8i9J0'
const rules = (text, where) => scanText(text, 'f.txt', where).map((f) => `${f.severity}:${f.rule}`)

describe('decodeJwtPayload', () => {
  it('reads the role out of a real token and refuses anything else', () => {
    expect(decodeJwtPayload(jwt({ role: 'anon' }))?.role).toBe('anon')
    expect(decodeJwtPayload('not.a.jwt')).toBeNull()
    expect(decodeJwtPayload('onlyonepart')).toBeNull()
  })
})

describe('redact', () => {
  it('never reveals more than the first few characters', () => {
    const shown = redact(secretKey)
    expect(shown.startsWith(secretKey.slice(0, 6))).toBe(true)
    expect(shown).not.toContain(secretKey)
    expect(shown).toContain(`${secretKey.length} characters`)
  })
})

describe('scanText: things that must be caught', () => {
  it('a Supabase secret key', () => expect(rules(`KEY = "${secretKey}"`)).toContain('error:supabase-secret-key'))

  it('a service_role token, in source and in the built site', () => {
    const token = jwt({ role: 'service_role', iss: 'supabase' })
    expect(rules(`const k = '${token}'`)).toContain('error:supabase-service-role-jwt')
    expect(rules(`!function(){var k="${token}"}()`, 'build')).toContain('error:supabase-service-role-jwt')
  })

  it('a service_role token even when its header is unusually short', () => {
    const short = `${b64url({ a: 1 })}.${b64url({ role: 'service_role' })}.${'s'.repeat(20)}`
    expect(rules(`k='${short}'`)).toContain('error:supabase-service-role-jwt')
  })

  it('a private key block', () => expect(rules('-----BEGIN ' + 'PRIVATE KEY-----')).toContain('error:private-key'))

  it('a GitHub token, an AWS key, an OpenAI-style key and a Google key', () => {
    expect(rules('t=' + 'ghp_' + 'A'.repeat(36))).toContain('error:github-token')
    expect(rules('AK' + 'IA' + 'ABCDEFGHIJKLMNOP')).toContain('error:aws-access-key')
    expect(rules('key: ' + 'sk-' + 'a'.repeat(30))).toContain('error:api-secret-key')
    expect(rules('AI' + 'za' + 'A'.repeat(35))).toContain('error:google-api-key')
  })

  it('a database address with a real password', () => {
    expect(rules('DATABASE=' + 'postgresql://postgres:' + 'hunter2hunter2' + '@db.example.supabase.co:5432/postgres')).toContain('error:database-url-password')
  })

  it('a secret assigned in an environment-style line', () => {
    expect(rules('SUPABASE_SERVICE_ROLE_KEY=' + 'x'.repeat(30))).toContain('error:env-secret-assignment')
    expect(rules('export DB_PASSWORD="' + 'y'.repeat(16) + '"')).toContain('error:env-secret-assignment')
  })
})

describe('scanText: things that are fine', () => {
  it('ordinary code and comments', () => {
    expect(rules('password: z.string().min(8, "Use at least 8 characters")')).toEqual([])
    expect(rules('// the service_role key must never appear in this project')).toEqual([])
    expect(rules('const url = import.meta.env.VITE_SUPABASE_URL')).toEqual([])
  })

  it('placeholders in .env.example and in database addresses', () => {
    expect(rules('VITE_SUPABASE_URL=https://your-project-ref.supabase.co\nVITE_SUPABASE_ANON_KEY=your-public-key')).toEqual([])
    expect(rules('postgresql://postgres:[YOUR-PASSWORD]@db.example.supabase.co:5432/postgres')).toEqual([])
    expect(rules('DB_PASSWORD=<your-password-here>')).toEqual([])
  })
})

describe('scanText: public keys', () => {
  it('warns about the public anon key in source, because it belongs in settings, but never calls it an error', () => {
    expect(rules(`k='${jwt({ role: 'anon' })}'`)).toEqual(['warning:supabase-anon-jwt'])
    expect(rules('k=' + 'sb_' + 'publishable_' + 'a'.repeat(24))).toEqual(['warning:supabase-publishable-key'])
  })

  it('expects the public key inside the built website', () => {
    expect(rules(`k='${jwt({ role: 'anon' })}'`, 'build')).toEqual([])
    expect(rules('k=' + 'sb_' + 'publishable_' + 'a'.repeat(24), 'build')).toEqual([])
  })

  it('reports line numbers', () => {
    const found = scanText(`line one\nline two\nKEY=${secretKey}`, 'f.txt')
    expect(found[0].line).toBe(3)
  })
})

describe('checkFileName', () => {
  it('flags files that normally hold secrets', () => {
    for (const name of ['.env', '.env.local', '.env.production', 'cert.pem', 'server.key', 'id_rsa', '.npmrc', 'config/.env.local']) {
      expect(checkFileName(name)?.rule).toBe('secret-file')
    }
  })

  it('allows .env.example and normal files', () => {
    for (const name of ['.env.example', 'src/App.tsx', 'README.md', 'package.json', 'src/lib/keyboard.ts']) expect(checkFileName(name)).toBeNull()
  })
})

describe('checkGitignore', () => {
  it('accepts this project\'s own .gitignore', () => {
    expect(checkGitignore(readFileSync('.gitignore', 'utf8'))).toEqual([])
  })

  it('names what is missing', () => {
    expect(checkGitignore('')).toHaveLength(4)
    expect(checkGitignore('node_modules\ndist\n')).toEqual(['.env', '.env.local (or *.local)'])
  })
})

describe('isScannable', () => {
  it('skips pictures, fonts and very large files, and reads source files', () => {
    expect(isScannable('logo.png', 100)).toBe(false)
    expect(isScannable('font.woff2', 100)).toBe(false)
    expect(isScannable('big.json', 5_000_000)).toBe(false)
    expect(isScannable('src/App.tsx', 2000)).toBe(true)
  })
})

describe('this project', () => {
  it('has no secrets in its own source, docs, database files or settings', () => {
    const problems = []
    const visit = (path) => {
      if (/node_modules|\.git$|dist$/.test(path)) return
      if (statSync(path).isDirectory()) { for (const name of readdirSync(path)) visit(join(path, name)); return }
      if (/^scripts[\\/]secretScan/.test(path) || !isScannable(path, statSync(path).size)) return
      for (const f of scanText(readFileSync(path, 'utf8'), path)) if (f.severity === 'error') problems.push(`${path}:${f.line} ${f.rule}`)
    }
    for (const p of ['src', 'supabase', 'docs', 'public', 'README.md', '.env.example', 'package.json', 'index.html', 'vercel.json', 'vite.config.ts', '.github']) visit(p)
    expect(problems).toEqual([])
  })
})
