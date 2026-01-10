import fs from 'fs'
import path from 'path'

const repoRoot = path.resolve(process.cwd())
const srcRoot = path.join(repoRoot, 'src')
const auditsRoot = path.join(repoRoot, 'audits')

function toPosix(p) {
  return p.split(path.sep).join('/')
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true })
}

function listFilesRecursive(rootDir) {
  /** @type {string[]} */
  const results = []
  /** @type {string[]} */
  const stack = [rootDir]

  while (stack.length) {
    const dir = stack.pop()
    if (!dir) continue

    const entries = fs.readdirSync(dir, { withFileTypes: true })
    for (const ent of entries) {
      const full = path.join(dir, ent.name)
      if (ent.isDirectory()) {
        if (ent.name === 'node_modules' || ent.name === '.next' || ent.name === 'audits') continue
        stack.push(full)
      } else if (ent.isFile()) {
        results.push(full)
      }
    }
  }

  return results
}

function readText(filePath) {
  return fs.readFileSync(filePath, 'utf8')
}

function isCodeFile(filePath) {
  return /\.(ts|tsx|js|jsx)$/.test(filePath)
}

function auditFile(relPath, text) {
  const hasProjectStatusBadge = text.includes('ProjectStatusBadge')
  const usesBadge = text.includes('<Badge') || text.includes(' Badge')

  const hits = {
    relPath,
    projectStatusInline: false,
    clientSelectionInline: false,
    localStatusBadgeHelper: false,
  }

  // Heuristics for likely ad-hoc status chips
  if (usesBadge) {
    if (/project\.status|\bstatus\s*:\s*['"](?:draft|sent|in-review|completed|archived)['"]/.test(text)) {
      hits.projectStatusInline = !hasProjectStatusBadge
    }

    if (/clientSelection|client_selection/.test(text)) {
      // Many client selection chips are ad-hoc and should be standardized
      hits.clientSelectionInline = !hasProjectStatusBadge
    }
  }

  if (/function\s+StatusBadge\b|const\s+StatusBadge\s*=/.test(text)) {
    hits.localStatusBadgeHelper = true
  }

  return hits
}

function main() {
  ensureDir(auditsRoot)

  const files = listFilesRecursive(srcRoot).filter(isCodeFile)

  /** @type {ReturnType<typeof auditFile>[]} */
  const results = []

  for (const abs of files) {
    const rel = toPosix(path.relative(repoRoot, abs))
    const text = readText(abs)
    results.push(auditFile(rel, text))
  }

  const projectStatusCandidates = results.filter(r => r.projectStatusInline)
  const clientSelectionCandidates = results.filter(r => r.clientSelectionInline)
  const localHelpers = results.filter(r => r.localStatusBadgeHelper)

  const md = [
    '# Status Badge Audit',
    '',
    'Goal: find places still rendering ad-hoc status chips instead of the shared `ProjectStatusBadge` component.',
    '',
    `Scanned: ${files.length} files under src/`,
    '',
    '## Findings',
    '',
    `- Project status chips likely ad-hoc (missing ProjectStatusBadge): ${projectStatusCandidates.length}`,
    `- Client selection chips likely ad-hoc (missing ProjectStatusBadge): ${clientSelectionCandidates.length}`,
    `- Local StatusBadge helpers found (review if they should be replaced): ${localHelpers.length}`,
    '',
    '### Project status ad-hoc candidates',
    ...projectStatusCandidates.map(r => `- ${r.relPath}`),
    '',
    '### Client selection ad-hoc candidates',
    ...clientSelectionCandidates.map(r => `- ${r.relPath}`),
    '',
    '### Local StatusBadge helpers',
    ...localHelpers.map(r => `- ${r.relPath}`),
    '',
  ].join('\n')

  const outPath = path.join(auditsRoot, 'status-badge-audit.md')
  fs.writeFileSync(outPath, md, 'utf8')

  // Console summary
  console.log(`Status badge audit complete. Wrote: ${toPosix(path.relative(repoRoot, outPath))}`)
  console.log(`Project status ad-hoc candidates: ${projectStatusCandidates.length}`)
  console.log(`Client selection ad-hoc candidates: ${clientSelectionCandidates.length}`)
  console.log(`Local StatusBadge helpers: ${localHelpers.length}`)
}

main()
