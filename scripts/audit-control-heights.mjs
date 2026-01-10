import fs from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();

// Control-height standard (responsive):
// - Mobile: 48px => h-12
// - Tablet/Desktop: 40px => md:h-10
const MOBILE_HEIGHT = 12;
const MD_HEIGHT = 10;

// Only flag common “almost-control” sizes that tend to drift.
// (We intentionally do NOT flag h-4/h-5/etc which are often icons/badges.)
const DISALLOWED_HEIGHTS = new Set([7, 8, 9, 11, 14, 16]);

// Files where we expect interactive controls to follow the standard height.
// Keep this list small and high-signal.
const STRICT_FILES = [
  "src/components/ui/button.tsx",
  "src/components/ui/input.tsx",
  "src/components/ui/toggle.tsx",
  "src/components/ui/select.tsx",
  "src/components/ui/date-picker.tsx",
  "src/components/ui/combobox.tsx",
  "src/components/ui/time-picker.tsx",
  "src/components/ui/pagination.tsx",
  "src/components/ui/breadcrumb.tsx",
  "src/components/ui/tabs.tsx",
  "src/components/ui/command.tsx",
  "src/components/ui/sidebar.tsx",
  "src/components/ui/dialog.tsx",
  "src/components/molecules/SegmentedControl.tsx",
  "src/components/molecules/ThemeToggle.tsx",
  "src/components/molecules/NotificationButton.tsx",
];

const SOURCE_GLOBS = ["src"]; // for "!h-*" global scan

function isCodeFile(filePath) {
  return /\.(ts|tsx|js|jsx)$/.test(filePath);
}

async function* walk(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      // Skip common heavy folders
      if (entry.name === "node_modules" || entry.name === ".next") continue;
      yield* walk(fullPath);
    } else {
      yield fullPath;
    }
  }
}

function findUnprefixedHeightMatches(line) {
  const matches = [];
  // Only match "h-XX" when it is NOT prefixed (e.g. NOT "md:h-10").
  const re = /(^|[\s"'])(!?)h-(\d+)\b/g;
  let m;
  while ((m = re.exec(line))) {
    matches.push({ important: m[2] === "!", value: Number(m[3]) });
  }
  return matches;
}

function findPrefixedHeightMatches(line) {
  const matches = [];
  const re = /\b(sm|md|lg|xl|2xl):(!?)h-(\d+)\b/g;
  let m;
  while ((m = re.exec(line))) {
    matches.push({ prefix: m[1], important: m[2] === "!", value: Number(m[3]) });
  }
  return matches;
}

function formatLocation(relPath, lineNumber) {
  return `${relPath}:${lineNumber}`;
}

async function scanStrictFiles() {
  const violations = [];

  for (const relPath of STRICT_FILES) {
    const absPath = path.join(ROOT, relPath);
    let content;
    try {
      content = await fs.readFile(absPath, "utf8");
    } catch {
      // If a file is missing, keep the audit resilient.
      continue;
    }

    const lines = content.split(/\r?\n/);
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Unprefixed heights must stay at mobile height (h-12).
      for (const h of findUnprefixedHeightMatches(line)) {
        if (h.value === MOBILE_HEIGHT) continue;
        if (DISALLOWED_HEIGHTS.has(h.value) || h.value === MD_HEIGHT) {
          violations.push({
            relPath,
            lineNumber: i + 1,
            message: `Found ${h.important ? "!" : ""}h-${h.value}; expected h-${MOBILE_HEIGHT} (mobile)`,
            line: line.trim(),
          });
        }
      }

      // md: heights must be 40px (md:h-10).
      for (const h of findPrefixedHeightMatches(line)) {
        if (h.prefix !== "md") continue;
        if (h.value === MD_HEIGHT) continue;
        violations.push({
          relPath,
          lineNumber: i + 1,
          message: `Found ${h.prefix}:${h.important ? "!" : ""}h-${h.value}; expected md:h-${MD_HEIGHT}`,
          line: line.trim(),
        });
      }
    }
  }

  return violations;
}

async function scanGlobalImportantHeights() {
  const violations = [];

  for (const base of SOURCE_GLOBS) {
    const absBase = path.join(ROOT, base);
    for await (const absPath of walk(absBase)) {
      if (!isCodeFile(absPath)) continue;

      const relPath = path.relative(ROOT, absPath).replace(/\\/g, "/");
      const content = await fs.readFile(absPath, "utf8");
      const lines = content.split(/\r?\n/);

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const re = /\b!h-(\d+)\b/g;
        let m;
        while ((m = re.exec(line))) {
          const value = Number(m[1]);
          if (value !== STANDARD_HEIGHT) {
            violations.push({
              relPath,
              lineNumber: i + 1,
              message: `Found !h-${value}; avoid !h-* (use h-${MOBILE_HEIGHT} md:h-${MD_HEIGHT})`,
              line: line.trim(),
            });
          }
        }
      }
    }
  }

  return violations;
}

function printViolations(title, violations) {
  if (violations.length === 0) return;
  console.log(`\n${title} (${violations.length})`);
  for (const v of violations) {
    console.log(`- ${formatLocation(v.relPath, v.lineNumber)}: ${v.message}`);
    console.log(`  ${v.line}`);
  }
}

async function main() {
  const strictViolations = await scanStrictFiles();
  const importantViolations = await scanGlobalImportantHeights();

  if (strictViolations.length === 0 && importantViolations.length === 0) {
    console.log(
      `OK: control heights aligned (mobile h-${MOBILE_HEIGHT}, md:h-${MD_HEIGHT}).`
    );
    return;
  }

  console.log("Control height audit failed.");
  printViolations("Strict file violations", strictViolations);
  printViolations("Global !h-* violations", importantViolations);
  process.exitCode = 1;
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
