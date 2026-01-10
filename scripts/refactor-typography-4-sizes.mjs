import fs from "fs";
import path from "path";

const repoRoot = path.resolve(process.cwd());
const srcRoot = path.join(repoRoot, "src");

/**
 * Conservative, string-based codemod for Tailwind typography tokens.
 * Goal: remove legacy DS tokens (text-heading-*, text-copy-*, text-label-*, text-button-*)
 * and arbitrary sizes (text-[...]) by mapping everything to ONLY:
 *   - text-label  (13px)
 *   - text-body   (15.6px)
 *   - text-title  (18.72px)
 *   - text-display(22.464px)
 */

function toPosix(p) {
  return p.split(path.sep).join("/");
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

/**
 * Replace tokens anywhere in the file text.
 * We intentionally also catch variant-prefixed forms like:
 *   file:text-copy-14, data-[x]:text-label-12, hover:text-heading-20
 */
function replaceAllTokens(text) {
  /** @type {Array<[RegExp, string]>} */
  const rules = [
    // Arbitrary sizes -> nearest allowed token
    [/\btext-\[0\.75rem\]\b/g, "text-label"],
    [/\btext-\[10px\]\b/g, "text-label"],
    [/\btext-\[clamp\([^\]]+\)\]\b/g, "text-display"],

    // Raw tailwind sizes (if any show up)
    [/\btext-xs\b/g, "text-label"],
    [/\btext-sm\b/g, "text-body"],
    [/\btext-base\b/g, "text-body"],
    [/\btext-lg\b/g, "text-title"],
    [/\btext-xl\b/g, "text-display"],
    [/\btext-2xl\b/g, "text-display"],
    [/\btext-3xl\b/g, "text-display"],

    // Headings -> display/title/body
    [/\btext-heading-(?:72|64|56|48|40|32|25|24)\b/g, "text-display"],
    [/\btext-heading-20\b/g, "text-title"],
    [/\btext-heading-(?:16|14)\b/g, "text-body"],

    // Copy -> title/body/label
    [/\btext-copy-(?:24|20|18)\b/g, "text-title"],
    [/\btext-copy-(?:16|14)\b/g, "text-body"],
    [/\btext-copy-(?:13|12)\b/g, "text-label"],
    [/\btext-copy-13-mono\b/g, "text-label"],

    // Labels -> title/body/label
    [/\btext-label-(?:20|18|16)\b/g, "text-title"],
    [/\btext-label-14\b/g, "text-body"],
    [/\btext-label-(?:13|12|11)\b/g, "text-label"],
    [/\btext-label-(?:14|13|12)-mono\b/g, "text-label"],

    // Buttons (if present)
    [/\btext-button-(?:16|14)\b/g, "text-body"],
    [/\btext-button-12\b/g, "text-label"],
  ];

  let out = text;
  for (const [re, replacement] of rules) {
    out = out.replace(re, replacement);
  }

  return out;
}

function main() {
  if (!fs.existsSync(srcRoot)) {
    console.error(`No existe ${srcRoot}`);
    process.exit(1);
  }

  const all = listFilesRecursive(srcRoot).filter((abs) =>
    /\.(ts|tsx|js|jsx|css)$/.test(abs)
  );

  let changedFiles = 0;
  let changedBytes = 0;

  for (const abs of all) {
    const before = fs.readFileSync(abs, "utf8");
    const after = replaceAllTokens(before);
    if (after !== before) {
      fs.writeFileSync(abs, after, "utf8");
      changedFiles++;
      changedBytes += Math.abs(after.length - before.length);
    }
  }

  console.log(
    JSON.stringify(
      {
        changedFiles,
        changedBytes,
        root: toPosix(path.relative(repoRoot, srcRoot)) || "src",
      },
      null,
      2
    )
  );
}

main();
