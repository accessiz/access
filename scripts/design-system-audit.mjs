import fs from "fs";
import path from "path";

const repoRoot = path.resolve(process.cwd());
const srcRoot = path.join(repoRoot, "src");
const auditsRoot = path.join(repoRoot, "audits");

function toPosix(p) {
  return p.split(path.sep).join("/");
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function listFilesRecursive(rootDir) {
  /** @type {string[]} */
  const results = [];
  /** @type {string[]} */
  const stack = [rootDir];

  while (stack.length) {
    const dir = stack.pop();
    if (!dir) continue;

    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const ent of entries) {
      const full = path.join(dir, ent.name);
      if (ent.isDirectory()) {
        if (ent.name === "node_modules" || ent.name === ".next" || ent.name === "audits") continue;
        stack.push(full);
      } else if (ent.isFile()) {
        results.push(full);
      }
    }
  }

  return results;
}

function readText(filePath) {
  return fs.readFileSync(filePath, "utf8");
}

function findAllMatchesWithLineNumbers(text, regex) {
  /** @type {{line:number, col:number, match:string}[]} */
  const hits = [];
  const lines = text.split(/\r?\n/);

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    let m;
    const r = new RegExp(regex.source, regex.flags.includes("g") ? regex.flags : regex.flags + "g");
    while ((m = r.exec(line)) !== null) {
      hits.push({ line: i + 1, col: (m.index ?? 0) + 1, match: m[0] });
    }
  }

  return hits;
}

function auditFile(relPath, text) {
  const issues = [];

  const isDashboard = relPath.startsWith("src/app/dashboard/");
  const isCss = relPath.endsWith(".css");

  // 1) Hardcoded hex colors (DS: prefer tokens/vars)
  // Allow in known theme sources; otherwise warn.
  const allowHex = [
    "src/app/globals.css",
    "material-theme.json",
    "tailwind.config.ts",
  ].some((p) => relPath.endsWith(p) || relPath === p);

  if (!allowHex) {
    const hexHits = findAllMatchesWithLineNumbers(text, /#[0-9a-fA-F]{3,8}\b/g);
    if (hexHits.length) {
      issues.push({
        code: "COLOR_HEX",
        severity: "warn",
        title: "Hardcoded hex color",
        detail: "Evitar hex hardcodeados; usar tokens/vars (DESIGN_SYSTEM.md §1.1).",
        hits: hexHits.slice(0, 20),
      });
    }
  }

  // 2) Tailwind palette colors (red-500, blue-600, etc.) – prefer semantic tokens
  const twColorHits = findAllMatchesWithLineNumbers(
    text,
    /\b(?:bg|text|border|ring)-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-\d{2,3}(?:\/\d{1,3})?\b/g
  );
  if (twColorHits.length) {
    issues.push({
      code: "COLOR_TW_PALETTE",
      severity: "warn",
      title: "Tailwind palette color usage",
      detail: "Preferir roles semánticos/tokens (primary/secondary/muted/success/warning/info/destructive).",
      hits: twColorHits.slice(0, 25),
    });
  }

  // 3) Dashboard layout padding anomalies (DS: page content padding p-6; gap-6)
  if (isDashboard) {
    const padHits = findAllMatchesWithLineNumbers(text, /\b(?:p|px|py|pl|pr|pt|pb)-(?:7|8|9|10|11|12)\b/g);
    const mdPadHits = findAllMatchesWithLineNumbers(text, /\b(?:sm|md|lg|xl):(?:p|px|py|pl|pr|pt|pb)-(?:7|8|9|10|11|12)\b/g);
    if (padHits.length || mdPadHits.length) {
      issues.push({
        code: "DASH_PADDING",
        severity: "warn",
        title: "Dashboard padding may diverge from p-6",
        detail: "En /dashboard/* el padding debe venir del layout (p-6). Evitar padding extra en páginas/components wrappers.",
        hits: [...padHits, ...mdPadHits].slice(0, 25),
      });
    }

    const gapHits = findAllMatchesWithLineNumbers(text, /\bgap-(?:1|2|3|4|5)\b/g);
    if (gapHits.length) {
      issues.push({
        code: "DASH_GAP",
        severity: "note",
        title: "Non-standard gap in dashboard",
        detail: "DS sugiere gap-6 entre secciones principales. Gaps menores pueden ser correctos dentro de componentes; revisar.",
        hits: gapHits.slice(0, 25),
      });
    }
  }

  // 4) Typography tokens vs raw sizes (heuristic)
  const rawTypeHits = findAllMatchesWithLineNumbers(text, /\btext-(?:xs|sm|base|lg|xl|2xl|3xl)\b/g);
  if (rawTypeHits.length) {
    issues.push({
      code: "TYPE_RAW",
      severity: "note",
      title: "Raw Tailwind text size",
      detail: "Preferir escala tipográfica del DS (text-display, text-title, text-body, text-label).",
      hits: rawTypeHits.slice(0, 25),
    });
  }

  // 5) Direct <label> usage (prefer UI Label)
  const labelTagHits = findAllMatchesWithLineNumbers(text, /<label\b/g);
  if (labelTagHits.length) {
    issues.push({
      code: "FORM_LABEL_TAG",
      severity: "note",
      title: "Raw <label> tag",
      detail: "Preferir <Label> (src/components/ui/label.tsx) para consistencia tipográfica y estados.",
      hits: labelTagHits.slice(0, 15),
    });
  }

  // 6) CSS: hardcoded colors in CSS files (except globals)
  if (isCss && !relPath.endsWith("src/app/globals.css")) {
    const cssHexHits = findAllMatchesWithLineNumbers(text, /#[0-9a-fA-F]{3,8}\b/g);
    if (cssHexHits.length) {
      issues.push({
        code: "CSS_HEX",
        severity: "warn",
        title: "Hardcoded hex in CSS",
        detail: "Usar variables CSS del tema y roles M3 en lugar de hex en CSS local.",
        hits: cssHexHits.slice(0, 25),
      });
    }
  }

  const summary = {
    relPath,
    issueCount: issues.length,
    hasWarn: issues.some((i) => i.severity === "warn"),
    hasNote: issues.some((i) => i.severity === "note"),
  };

  return { summary, issues };
}

function renderReportMarkdown({ summary, issues }) {
  const status = summary.hasWarn ? "WARN" : summary.hasNote ? "OK (notes)" : "OK";
  const lines = [];
  lines.push(`# Audit: ${summary.relPath}`);
  lines.push("");
  lines.push(`- **Estado:** ${status}`);
  lines.push(`- **Issues:** ${summary.issueCount}`);
  lines.push("");

  if (!issues.length) {
    lines.push("Sin hallazgos por heurística. (Esto no garantiza perfección; revisar manualmente si hay UI específica.)");
    return lines.join("\n");
  }

  for (const issue of issues) {
    lines.push(`## ${issue.severity.toUpperCase()}: ${issue.code}`);
    lines.push("");
    lines.push(`- **${issue.title}**`);
    lines.push(`- ${issue.detail}`);
    if (issue.hits?.length) {
      lines.push("");
      lines.push("**Ejemplos (línea:col):**");
      for (const h of issue.hits) {
        lines.push(`- ${h.line}:${h.col}  \`${h.match.replace(/`/g, "' ")}\``);
      }
    }
    lines.push("");
  }

  return lines.join("\n");
}

function main() {
  if (!fs.existsSync(srcRoot)) {
    console.error(`No existe ${srcRoot}`);
    process.exit(1);
  }

  ensureDir(auditsRoot);

  const all = listFilesRecursive(srcRoot)
    .filter((abs) => {
      const rel = toPosix(path.relative(repoRoot, abs));
      return (
        rel.startsWith("src/") &&
        (rel.endsWith(".ts") || rel.endsWith(".tsx") || rel.endsWith(".js") || rel.endsWith(".jsx") || rel.endsWith(".css"))
      );
    })
    .sort((a, b) => a.localeCompare(b));

  /** @type {{file:string, report:string, summary:any}[]} */
  const manifest = [];

  let warnCount = 0;
  let noteCount = 0;

  for (const abs of all) {
    const rel = toPosix(path.relative(repoRoot, abs));
    const text = readText(abs);
    const audit = auditFile(rel, text);

    if (audit.summary.hasWarn) warnCount++;
    else if (audit.summary.hasNote) noteCount++;

    const reportRel = toPosix(path.join("audits", rel + ".md"));
    const reportAbs = path.join(repoRoot, reportRel);
    ensureDir(path.dirname(reportAbs));
    fs.writeFileSync(reportAbs, renderReportMarkdown(audit), "utf8");

    manifest.push({ file: rel, report: reportRel, summary: audit.summary });
  }

  const summaryLines = [];
  summaryLines.push("# Design System Audit Summary");
  summaryLines.push("");
  summaryLines.push(`- **Fecha:** ${new Date().toISOString()}`);
  summaryLines.push(`- **Archivos auditados:** ${manifest.length}`);
  summaryLines.push(`- **Con warnings:** ${warnCount}`);
  summaryLines.push(`- **Con notas:** ${noteCount}`);
  summaryLines.push(`- **Sin hallazgos:** ${manifest.length - warnCount - noteCount}`);
  summaryLines.push("");
  summaryLines.push("## Manifest");
  summaryLines.push("");
  summaryLines.push("El archivo `audits/manifest.json` lista **todos** los archivos bajo `src/` incluidos en el audit y el path a su reporte.");
  summaryLines.push("");

  fs.writeFileSync(path.join(auditsRoot, "summary.md"), summaryLines.join("\n"), "utf8");
  fs.writeFileSync(path.join(auditsRoot, "manifest.json"), JSON.stringify({
    generatedAt: new Date().toISOString(),
    root: "src",
    files: manifest,
  }, null, 2), "utf8");

  console.log(`Audited ${manifest.length} files. warnings=${warnCount}, notes=${noteCount}`);
  console.log(`Wrote: ${toPosix(path.relative(repoRoot, path.join(auditsRoot, "summary.md")))}`);
  console.log(`Wrote: ${toPosix(path.relative(repoRoot, path.join(auditsRoot, "manifest.json")))}`);
}

main();
