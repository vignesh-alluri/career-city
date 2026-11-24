// Run with `npm run secrets` (before you commit or push) and `npm run secrets:dist` (after a build).
// It looks at every file git would commit, and prints anything that looks like a secret. It never prints the secret itself.
import { execFileSync } from 'node:child_process'
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { checkFileName, checkGitignore, isScannable, scanText } from './secretScan.mjs'

const dist = process.argv.includes('--dist')
const root = process.cwd()
const SELF = new Set(['scripts/secretScan.mjs', 'scripts/secretScan.test.mjs', 'scripts/check-secrets.mjs']) // the rules themselves contain example patterns

function walk(dir, out = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) { if (!['node_modules', '.git'].includes(entry.name)) walk(full, out) }
    else out.push(relative(root, full).replace(/\\/g, '/'))
  }
  return out
}

/** What would be committed: files git already tracks, plus new files that .gitignore does not hide. Needs `git init` to have been run. */
function committableFiles() {
  try {
    const out = execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard'], { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] })
    return { files: out.split('\n').map((s) => s.trim()).filter(Boolean), viaGit: true }
  } catch {
    const files = walk(root).filter((f) => !f.startsWith('dist/'))
    return { files, viaGit: false }
  }
}

const findings = []
let files, viaGit = true
if (dist) {
  if (!existsSync(join(root, 'dist'))) { console.error('No dist folder. Run npm run build first.'); process.exit(1) }
  files = walk(join(root, 'dist'))
} else {
  ;({ files, viaGit } = committableFiles())
  if (existsSync(join(root, '.gitignore'))) {
    const missing = checkGitignore(readFileSync(join(root, '.gitignore'), 'utf8'))
    for (const m of missing) findings.push({ file: '.gitignore', line: 0, rule: 'gitignore-missing', severity: 'error', why: `.gitignore does not list ${m}.`, preview: '' })
  } else findings.push({ file: '.gitignore', line: 0, rule: 'gitignore-missing', severity: 'error', why: 'There is no .gitignore file.', preview: '' })
}

for (const file of files) {
  if (SELF.has(file) || !existsSync(join(root, file))) continue
  if (!dist) { const nameProblem = checkFileName(file); if (nameProblem) findings.push(nameProblem) }
  const size = statSync(join(root, file)).size
  if (!isScannable(file, size) && !(dist && /\.map$/.test(file))) continue
  findings.push(...scanText(readFileSync(join(root, file), 'utf8'), file, dist ? 'build' : 'source'))
}

const errors = findings.filter((f) => f.severity === 'error')
const warnings = findings.filter((f) => f.severity === 'warning')
console.log(`Secret check (${dist ? 'built website' : 'files that would be committed'}): ${files.length} files looked at.`)
if (!dist && !viaGit) console.log('Note: git is not set up here yet, so every file outside node_modules and dist was checked. Run `git init` first for an exact result.')
for (const f of [...errors, ...warnings]) console.log(`${f.severity === 'error' ? 'ERROR  ' : 'warning'} ${f.file}${f.line ? `:${f.line}` : ''}  ${f.why}${f.preview ? `  [${f.preview}]` : ''}`)
if (errors.length) { console.log(`\n${errors.length} problem(s) to fix BEFORE you push. If a real key was already pushed anywhere, treat it as leaked: create a new one in the provider's dashboard and delete the old one.`); process.exit(1) }
console.log(warnings.length ? `\nNo secrets found, ${warnings.length} warning(s) above.` : '\nNo secrets found.')
