// Finds things that must never be committed: private keys, secret tokens, database passwords and secret files.
// Plain JavaScript with no dependencies, so it runs with just Node, before `npm install` has even finished.
// Pure functions only (no file or git access here), so every rule is covered by tests.

/** Decodes the middle part of a JWT (the part that says who it is for). Returns null if it is not a real JWT. */
export function decodeJwtPayload(token) {
  const parts = token.split('.')
  if (parts.length !== 3) return null
  try {
    const json = Buffer.from(parts[1].replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8')
    const payload = JSON.parse(json)
    return payload && typeof payload === 'object' ? payload : null
  } catch {
    return null
  }
}

/** Shows only the first characters and the length, so the report itself never leaks the secret it found. */
export function redact(value) {
  return `${value.slice(0, 6)}... (${value.length} characters)`
}

/**
 * Each rule: a pattern to look for, how serious it is, and why.
 *  error    must be fixed before pushing (the check fails)
 *  warning  not a secret, but it should not be in a committed file
 */
export const RULES = [
  { id: 'supabase-secret-key', severity: 'error', re: /\bsb_secret_[A-Za-z0-9_-]{16,}/g, why: 'A Supabase SECRET key. It bypasses all security rules.' },
  { id: 'private-key', severity: 'error', re: /-----BEGIN (?:RSA |EC |DSA |OPENSSH |PGP )?PRIVATE KEY(?: BLOCK)?-----/g, why: 'A private key.' },
  { id: 'github-token', severity: 'error', re: /\b(?:gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{40,})/g, why: 'A GitHub access token.' },
  { id: 'aws-access-key', severity: 'error', re: /\bAKIA[0-9A-Z]{16}\b/g, why: 'An AWS access key id.' },
  { id: 'api-secret-key', severity: 'error', re: /\b(?:sk-[A-Za-z0-9_-]{24,}|sk_live_[A-Za-z0-9]{16,}|rk_live_[A-Za-z0-9]{16,})/g, why: 'A secret API key (OpenAI, Anthropic, Stripe and similar).' },
  { id: 'google-api-key', severity: 'error', re: /\bAIza[0-9A-Za-z_-]{35}\b/g, why: 'A Google API key.' },
  { id: 'slack-token', severity: 'error', re: /\bxox[baprs]-[A-Za-z0-9-]{10,}/g, why: 'A Slack token.' },
  // a database address with a real password in it. A placeholder like [YOUR-PASSWORD] has brackets, so it does not match.
  { id: 'database-url-password', severity: 'error', re: /\bpostgres(?:ql)?:\/\/[^\s:@/]+:(?![\[<{])[^\s@/]{4,}@/g, why: 'A database address that contains its password.' },
  // an environment-style line: SECRET_THING=long-value (all capitals, as in a .env file)
  { id: 'env-secret-assignment', severity: 'error', re: /^\s*(?:export\s+)?[A-Z0-9_]*(?:SECRET|SERVICE_ROLE|PRIVATE_KEY|PASSWORD|ACCESS_TOKEN)[A-Z0-9_]*\s*=\s*["']?(?![\[<{])[^\s"'#]{12,}/gm, why: 'A secret value assigned in an environment-style line.' },
]

const JWT = /\beyJ[A-Za-z0-9_-]{3,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}/g
const PUBLISHABLE = /\bsb_publishable_[A-Za-z0-9_-]{16,}/g

/**
 * Looks through the text of one file. `where` says what the file is: 'source' (a file that would be committed) or 'build' (the
 * built website, where the public key is expected to appear because the site needs it to talk to Supabase).
 */
export function scanText(text, file, where = 'source') {
  const findings = []
  const lines = text.split(/\r?\n/)
  const add = (rule, severity, why, lineIndex, match) => findings.push({ file, line: lineIndex + 1, rule, severity, why, preview: redact(match) })

  lines.forEach((line, i) => {
    for (const rule of RULES) {
      rule.re.lastIndex = 0
      const m = rule.re.exec(line)
      if (m) add(rule.id, rule.severity, rule.why, i, m[0].trim())
    }
    for (const m of line.matchAll(JWT)) {
      const role = decodeJwtPayload(m[0])?.role
      if (role === 'service_role') add('supabase-service-role-jwt', 'error', 'A Supabase service_role key. It bypasses all security rules.', i, m[0])
      else if (where === 'source' && role === 'anon') add('supabase-anon-jwt', 'warning', 'The public Supabase anon key. It is designed to be public, but keep it in .env.local and Vercel settings, not in committed files.', i, m[0])
      else if (where === 'source' && role === undefined) add('unknown-jwt', 'warning', 'A token (JWT) of unknown purpose.', i, m[0])
    }
    if (where === 'source') for (const m of line.matchAll(PUBLISHABLE)) add('supabase-publishable-key', 'warning', 'The public Supabase key. It is designed to be public, but keep it in .env.local and Vercel settings, not in committed files.', i, m[0])
  })
  return findings
}

/** Files that should never be in a repository, by name alone. `.env.example` is the one allowed exception. */
export function checkFileName(path) {
  const name = path.split(/[\\/]/).pop() ?? ''
  const secretFile = (/^\.env(\..+)?$/.test(name) && name !== '.env.example') || /\.(pem|p12|pfx|key)$/i.test(name) || /^id_(rsa|dsa|ecdsa|ed25519)$/.test(name) || name === '.npmrc'
  return secretFile ? { file: path, line: 0, rule: 'secret-file', severity: 'error', why: 'A file that normally holds secrets must not be committed.', preview: name } : null
}

/** Does .gitignore keep the usual secret files and folders out? Returns what is missing. */
export function checkGitignore(text) {
  const lines = new Set(text.split(/\r?\n/).map((l) => l.trim()))
  const missing = []
  if (!lines.has('.env') && !lines.has('.env*') && !lines.has('.env.*')) missing.push('.env')
  if (!['*.local', '.env.local', '.env*', '.env.*'].some((p) => lines.has(p))) missing.push('.env.local (or *.local)')
  if (!lines.has('node_modules') && !lines.has('node_modules/')) missing.push('node_modules')
  if (!lines.has('dist') && !lines.has('dist/')) missing.push('dist')
  return missing
}

/** Skips files that cannot hold readable secrets (pictures, fonts, archives) and anything too large to be a text file. */
export function isScannable(path, size) {
  return size <= 1_000_000 && !/\.(png|jpe?g|gif|webp|ico|svg|woff2?|ttf|otf|zip|gz|pdf|mp4|webm|glb|gltf|map)$/i.test(path)
}
