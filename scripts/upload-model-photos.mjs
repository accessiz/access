#!/usr/bin/env node

/**
 * upload-model-photos.mjs
 *
 * Bulk upload script for model photos -> Cloudflare R2 + Supabase DB.
 *
 * --- TWO-TIER COMPRESSION STRATEGY ---
 * PRINT  (cover + comp-card slots)  -> High-res for 300 DPI output
 *   * 4000x4000 max, WebP q=92, preserves detail for comp-card print
 * DISPLAY (portfolio gallery)        -> Optimized for web/mobile
 *   * 1200x1200 max, WebP q=80, fast loading
 *
 * --- SEPARATION RULE ---
 * Comp-card photos (portada + ficha) are NEVER copied into the portfolio.
 * Portfolio = only files in the model root folder.
 *
 * --- FOLDER STRUCTURE ---
 * {BASE_DIR}/{ModelName}/
 *   |-- ficha/portada/  -> Cover photo (1 file, PRINT quality)
 *   |-- ficha/          -> Comp-card slots 0,2,3 (up to 3 files, PRINT quality)
 *   \-- *.jpg|png|webp  -> Portfolio gallery (DISPLAY quality)
 *
 * Usage:
 *   node scripts/upload-model-photos.mjs [options]
 *
 * Options:
 *   --dry-run        Simulate without uploading
 *   --concurrency=N  Number of parallel workers (default: 3, max: 10)
 *   --dir=PATH       Override base directory
 *   --verbose        Show detailed per-file logs
 *   --models=a,b,c   Process only these model folder names
 */

import fs from 'fs';
import path from 'path';
import { S3Client, PutObjectCommand, DeleteObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch'; // Inyectado para forzar IPv4 y evitar bugs DNS

global.fetch = fetch;
import sharp from 'sharp';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

// ======================================================================
// Configuration & validation
// ======================================================================

/** @type {Record<string, string>} */
const REQUIRED_ENV = {
  R2_ACCOUNT_ID: process.env.R2_ACCOUNT_ID ?? '',
  R2_ACCESS_KEY_ID: process.env.R2_ACCESS_KEY_ID ?? '',
  R2_SECRET_ACCESS_KEY: process.env.R2_SECRET_ACCESS_KEY ?? '',
  R2_BUCKET_NAME: process.env.R2_BUCKET_NAME ?? '',
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
  SUPABASE_SERVICE_KEY: process.env.SUPABASE_SERVICE_KEY ?? '',
};

const missingEnv = Object.entries(REQUIRED_ENV)
  .filter(([, v]) => !v)
  .map(([k]) => k);

if (missingEnv.length > 0) {
  console.error(`Missing environment variables: ${missingEnv.join(', ')}`);
  process.exit(1);
}

// ======================================================================
// CLI argument parsing
// ======================================================================

const DRY_RUN = process.argv.includes('--dry-run');
const VERBOSE = process.argv.includes('--verbose');

function getArgValue(name) {
  const arg = process.argv.find((a) => a.startsWith(`--${name}=`));
  return arg ? arg.split('=').slice(1).join('=') : null;
}

const CONCURRENCY = Math.min(Math.max(parseInt(getArgValue('concurrency') ?? '3', 10) || 3, 1), 10);
const BASE_DIR = getArgValue('dir') ?? 'C:\\Users\\Evo-minidesk\\Downloads\\Mujeres';
const FILTER_MODELS = getArgValue('models')?.split(',').map((s) => s.trim().toLowerCase()) ?? null;

const IMAGE_EXTENSIONS = /\.(jpg|jpeg|png|webp|tiff|avif)$/i;

// ======================================================================
// Two-tier compression presets (aligned with src/lib/utils/image.ts)
// ======================================================================

/**
 * @typedef {'print' | 'display'} CompressionTier
 */

/** @type {Record<CompressionTier, { maxWidth: number; maxHeight: number; quality: number; label: string }>} */
const COMPRESSION_PRESETS = {
  print: {
    maxWidth: 3000,
    maxHeight: 3000,
    quality: 92,
    label: 'PRINT (high-res for comp-card / cover)',
  },
  display: {
    maxWidth: 1200,
    maxHeight: 1200,
    quality: 80,
    label: 'DISPLAY (web/mobile portfolio)',
  },
};

// ======================================================================
// Clients
// ======================================================================

const r2 = new S3Client({
  region: 'auto',
  endpoint: `https://${REQUIRED_ENV.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: REQUIRED_ENV.R2_ACCESS_KEY_ID,
    secretAccessKey: REQUIRED_ENV.R2_SECRET_ACCESS_KEY,
  },
});

const supabase = createClient(REQUIRED_ENV.NEXT_PUBLIC_SUPABASE_URL, REQUIRED_ENV.SUPABASE_SERVICE_KEY);

// ======================================================================
// Retry utility
// ======================================================================

const MAX_RETRIES = 3;
const BASE_DELAY_MS = 500;

/**
 * Retry an async operation with exponential backoff.
 * @template T
 * @param {() => Promise<T>} fn
 * @param {string} label - Used in error messages
 * @returns {Promise<T>}
 */
async function withRetry(fn, label) {
  let lastError;
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (attempt < MAX_RETRIES) {
        const delay = BASE_DELAY_MS * 2 ** (attempt - 1);
        if (VERBOSE) console.warn(`  [RETRY ${attempt}/${MAX_RETRIES}] ${label}: ${err.message} -- waiting ${delay}ms`);
        await new Promise((r) => setTimeout(r, delay));
      }
    }
  }
  throw lastError;
}

// ======================================================================
// Image compression
// ======================================================================

/**
 * Compress an image with tier-appropriate settings.
 * Uses sharp for server-side processing with EXIF auto-rotation.
 *
 * @param {string}          inputPath  - Absolute filesystem path
 * @param {CompressionTier} tier       - 'print' or 'display'
 * @returns {Promise<{ buffer: Buffer; originalSize: number; compressedSize: number }>}
 */
async function compressImage(inputPath, tier) {
  const preset = COMPRESSION_PRESETS[tier];
  const originalSize = fs.statSync(inputPath).size;

  const buffer = await sharp(inputPath)
    .rotate() // Auto-rotate based on EXIF
    .resize({
      width: preset.maxWidth,
      height: preset.maxHeight,
      fit: 'inside',
      withoutEnlargement: true,
    })
    .webp({ quality: preset.quality })
    .toBuffer();

  if (VERBOSE) {
    const saved = ((1 - buffer.length / originalSize) * 100).toFixed(1);
    console.log(`    [${preset.label}] ${path.basename(inputPath)}: ${formatBytes(originalSize)} -> ${formatBytes(buffer.length)} (-${saved}%)`);
  }

  return { buffer, originalSize, compressedSize: buffer.length };
}

// ======================================================================
// R2 operations
// ======================================================================

/**
 * Delete all objects matching a prefix in R2.
 * @param {string}       modelId
 * @param {string}       category
 * @param {number|null}  slotIndex
 */
async function deleteOldFiles(modelId, category, slotIndex = null) {
  if (DRY_RUN) return;

  const prefix = `${modelId}/${category}/`;
  const searchPrefix =
    category === 'Contraportada' && slotIndex !== null ? `${prefix}comp_${slotIndex}_` : prefix;

  const listCommand = new ListObjectsV2Command({
    Bucket: REQUIRED_ENV.R2_BUCKET_NAME,
    Prefix: searchPrefix,
  });

  const listedObjects = await withRetry(() => r2.send(listCommand), `list ${searchPrefix}`);

  if (!listedObjects.Contents?.length) return;

  // Delete sequentially to avoid R2 rate limits on free tier
  for (const obj of listedObjects.Contents) {
    if (!obj.Key) continue;
    await withRetry(
      () => r2.send(new DeleteObjectCommand({ Bucket: REQUIRED_ENV.R2_BUCKET_NAME, Key: obj.Key })),
      `delete ${obj.Key}`
    );
  }
}

/**
 * Upload a buffer to R2 and return the remote key.
 * @param {Buffer} buffer
 * @param {string} modelId
 * @param {string} category   - R2 folder: 'Portada' | 'Contraportada' | 'PortfolioGallery'
 * @param {string} fileName
 * @returns {Promise<string>}  Full R2 key
 */
async function uploadToR2(buffer, modelId, category, fileName) {
  const fullPath = `${modelId}/${category}/${fileName}`;
  if (DRY_RUN) return fullPath;

  await withRetry(
    () =>
      r2.send(
        new PutObjectCommand({
          Bucket: REQUIRED_ENV.R2_BUCKET_NAME,
          Key: fullPath,
          Body: buffer,
          ContentType: 'image/webp',
        })
      ),
    `upload ${fullPath}`
  );

  return fullPath;
}

// ======================================================================
// File discovery helpers
// ======================================================================

/**
 * List image files in a directory (non-recursive).
 * @param {string} dirPath
 * @returns {string[]}  Sorted filenames (alphabetical for deterministic slot assignment)
 */
function listImages(dirPath) {
  if (!fs.existsSync(dirPath)) return [];
  return fs
    .readdirSync(dirPath)
    .filter((f) => {
      const full = path.join(dirPath, f);
      return fs.statSync(full).isFile() && IMAGE_EXTENSIONS.test(f);
    })
    .sort();
}

// ======================================================================
// Per-model processing
// ======================================================================

/**
 * @typedef {Object} ModelResult
 * @property {string}            name
 * @property {string}            id
 * @property {string|null}       cover
 * @property {(string|null)[]}   compcards
 * @property {string[]}          portfolio
 * @property {'Success'|'Failed'} status
 * @property {string}            reason
 * @property {{ printFiles: number; displayFiles: number; totalOriginalBytes: number; totalCompressedBytes: number }} stats
 */

/**
 * Process a single model: discover photos, compress with correct tier, upload, update DB.
 *
 * @param {string} modelName  - Folder name
 * @param {string} modelId    - Supabase UUID
 * @returns {Promise<ModelResult>}
 */
async function processModel(modelName, modelId) {
  const modelPath = path.join(BASE_DIR, modelName);
  const fichaPath = path.join(modelPath, 'ficha');
  const portadaPath = path.join(fichaPath, 'portada');

  /** @type {ModelResult} */
  const result = {
    name: modelName,
    id: modelId,
    cover: null,
    compcards: [null, null, null, null],
    portfolio: [],
    status: 'Success',
    reason: '',
    stats: { printFiles: 0, displayFiles: 0, totalOriginalBytes: 0, totalCompressedBytes: 0 },
  };

  try {
    // ========== 1. COVER (Portada) -- PRINT tier ==========
    const coverFiles = listImages(portadaPath);
    if (coverFiles.length > 0) {
      const ts = Date.now();
      const { buffer, originalSize, compressedSize } = await compressImage(
        path.join(portadaPath, coverFiles[0]),
        'print'
      );
      await deleteOldFiles(modelId, 'Portada');
      result.cover = await uploadToR2(buffer, modelId, 'Portada', `${ts}-cover.webp`);
      result.stats.printFiles++;
      result.stats.totalOriginalBytes += originalSize;
      result.stats.totalCompressedBytes += compressedSize;
    }

    // ========== 2. COMP CARDS (Ficha) -- PRINT tier ==========
    // Up to 3 photos mapped to slots [0, 2, 3] (slot 1 reserved for future use)
    const fichaFiles = listImages(fichaPath).slice(0, 3);
    const TARGET_SLOTS = [0, 2, 3];

    for (let i = 0; i < fichaFiles.length; i++) {
      const slotIndex = TARGET_SLOTS[i];
      const ts = Date.now() + i;
      const { buffer, originalSize, compressedSize } = await compressImage(
        path.join(fichaPath, fichaFiles[i]),
        'print'
      );
      await deleteOldFiles(modelId, 'Contraportada', slotIndex);
      result.compcards[slotIndex] = await uploadToR2(
        buffer,
        modelId,
        'Contraportada',
        `comp_${slotIndex}_${ts}.webp`
      );
      result.stats.printFiles++;
      result.stats.totalOriginalBytes += originalSize;
      result.stats.totalCompressedBytes += compressedSize;
    }

    // ========== 3. PORTFOLIO GALLERY -- DISPLAY tier ==========
    // ONLY files in the model root folder. NEVER copies from ficha/.
    const portfolioFiles = listImages(modelPath);

    if (portfolioFiles.length > 0) {
      await deleteOldFiles(modelId, 'PortfolioGallery');

      for (let i = 0; i < portfolioFiles.length; i++) {
        const ts = Date.now() + i + 100; // offset to avoid timestamp collision
        const { buffer, originalSize, compressedSize } = await compressImage(
          path.join(modelPath, portfolioFiles[i]),
          'display'
        );
        const remotePath = await uploadToR2(buffer, modelId, 'PortfolioGallery', `${ts}-gallery.webp`);
        result.portfolio.push(remotePath);
        result.stats.displayFiles++;
        result.stats.totalOriginalBytes += originalSize;
        result.stats.totalCompressedBytes += compressedSize;
      }
    }
    // NOTE: If no portfolio files exist, we do NOT fall back to ficha photos.
    // Comp-card photos must never appear in the portfolio to avoid visual duplication.

    // ========== 4. DATABASE UPDATE ==========
    if (!DRY_RUN) {
      const updateData = {};

      if (result.cover) updateData.cover_path = result.cover;

      // Only update comp_card_paths if we actually uploaded comp cards
      const hasCompCards = result.compcards.some((p) => p !== null);
      if (hasCompCards) updateData.comp_card_paths = result.compcards;

      if (result.portfolio.length > 0) updateData.gallery_paths = result.portfolio;

      if (Object.keys(updateData).length > 0) {
        const { error } = await supabase.from('models').update(updateData).eq('id', modelId);
        if (error) throw new Error(`DB update failed: ${error.message}`);
      }
    }

    console.log(
      `  [OK] ${modelName} -- print: ${result.stats.printFiles}, display: ${result.stats.displayFiles}, ` +
      `saved: ${formatBytes(result.stats.totalOriginalBytes - result.stats.totalCompressedBytes)}`
    );
    return result;
  } catch (err) {
    console.error(`  [FAIL] ${modelName}: ${err.message}`);
    result.status = 'Failed';
    result.reason = err.message;
    return result;
  }
}

// ======================================================================
// Matching logic
// ======================================================================

/**
 * Normalize a string for fuzzy matching (lowercase, trim, collapse whitespace).
 * @param {string} s
 * @returns {string}
 */
function normalize(s) {
  return (s ?? '').toLowerCase().trim().replace(/\s+/g, ' ');
}

/**
 * Find a model in the DB by folder name -> alias or full_name.
 * @param {string} folderName
 * @param {{ id: string; full_name: string; alias: string | null }[]} allModels
 * @returns {{ id: string; full_name: string; alias: string | null } | undefined}
 */
function findModel(folderName, allModels) {
  const normalizedFolder = normalize(folderName);
  return allModels.find(
    (m) => normalize(m.alias) === normalizedFolder || normalize(m.full_name) === normalizedFolder
  );
}

// ======================================================================
// Main orchestrator
// ======================================================================

async function main() {
  const startTime = Date.now();

  console.log('==========================================================');
  console.log('       Model Photo Bulk Upload                            ');
  console.log('==========================================================');
  console.log(`  Mode:        ${DRY_RUN ? 'DRY RUN (no uploads)' : 'LIVE'}`);
  console.log(`  Concurrency: ${CONCURRENCY}`);
  console.log(`  Base dir:    ${BASE_DIR}`);
  console.log(`  Tiers:       PRINT=${COMPRESSION_PRESETS.print.quality}q/${COMPRESSION_PRESETS.print.maxWidth}px, DISPLAY=${COMPRESSION_PRESETS.display.quality}q/${COMPRESSION_PRESETS.display.maxWidth}px`);
  console.log('');

  if (!fs.existsSync(BASE_DIR)) {
    console.error(`Base directory not found: ${BASE_DIR}`);
    process.exit(1);
  }

  // Discover model folders
  let folders = fs
    .readdirSync(BASE_DIR)
    .filter((f) => fs.statSync(path.join(BASE_DIR, f)).isDirectory());

  if (FILTER_MODELS) {
    folders = folders.filter((f) => FILTER_MODELS.includes(f.toLowerCase().trim()));
    console.log(`  Filter:      ${folders.length} model(s) matched\n`);
  }

  if (folders.length === 0) {
    console.log('No model folders found. Exiting.');
    process.exit(0);
  }

  // Fetch all models from DB in one query
  const { data: allModels, error: dbError } = await supabase.from('models').select('id, full_name, alias');
  if (dbError) {
    console.error(`Failed to fetch models from DB: ${dbError.message}`);
    process.exit(1);
  }

  console.log(`  Found ${folders.length} folder(s), ${allModels.length} model(s) in DB.\n`);

  // --- Thread-safe queue ---
  // Atomic index counter instead of array.shift() (avoids race condition)
  let nextIndex = 0;
  const report = [];

  const workers = Array.from({ length: CONCURRENCY }, async (_, workerIdx) => {
    while (true) {
      const idx = nextIndex++;
      if (idx >= folders.length) break;

      const folder = folders[idx];
      const model = findModel(folder, allModels);

      if (!model) {
        console.warn(`  [SKIP] No DB match for: "${folder}"`);
        report.push({ name: folder, id: null, status: 'Failed', reason: 'No matching model in database', stats: null });
        continue;
      }

      const result = await processModel(folder, model.id);
      report.push(result);
    }
  });

  await Promise.all(workers);

  // --- Summary ---
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  const successCount = report.filter((r) => r.status === 'Success').length;
  const failCount = report.length - successCount;
  const totalOriginal = report.reduce((s, r) => s + (r.stats?.totalOriginalBytes ?? 0), 0);
  const totalCompressed = report.reduce((s, r) => s + (r.stats?.totalCompressedBytes ?? 0), 0);

  console.log('\n==========================================================');
  console.log(`  Done in ${elapsed}s -- ${successCount} succeeded, ${failCount} failed`);
  console.log(`  Total: ${formatBytes(totalOriginal)} -> ${formatBytes(totalCompressed)} (saved ${formatBytes(totalOriginal - totalCompressed)})`);
  console.log('==========================================================\n');

  generateHtmlReport(report, { elapsed, totalOriginal, totalCompressed });
}

// ======================================================================
// HTML report
// ======================================================================

function generateHtmlReport(report, meta) {
  const successCount = report.filter((r) => r.status === 'Success').length;
  const failCount = report.length - successCount;

  const rows = report
    .map((r) => {
      const info =
        r.status === 'Failed'
          ? r.reason
          : `Cover: ${r.cover ? 'Yes' : 'No'}, CompCards: ${r.compcards?.filter(Boolean).length ?? 0}, Portfolio: ${r.portfolio?.length ?? 0}` +
          (r.stats ? ` | ${formatBytes(r.stats.totalOriginalBytes)} -> ${formatBytes(r.stats.totalCompressedBytes)}` : '');
      const cls = r.status === 'Success' ? 'success' : 'failed';
      return `<tr>
        <td>${escapeHtml(r.name)}</td>
        <td class="mono">${r.id ?? 'N/A'}</td>
        <td class="${cls}">${r.status}</td>
        <td>${escapeHtml(info)}</td>
      </tr>`;
    })
    .join('\n');

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Upload Report</title>
  <style>
    :root { --bg: #0d1117; --fg: #c9d1d9; --border: #30363d; --green: #3fb950; --red: #f85149; }
    * { box-sizing: border-box; margin: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: var(--bg); color: var(--fg); padding: 2rem; }
    h1 { font-size: 1.5rem; margin-bottom: .5rem; }
    .meta { color: #8b949e; margin-bottom: 1.5rem; font-size: .875rem; }
    .filter-bar { display: flex; gap: 1rem; margin-bottom: 1rem; align-items: center; }
    .filter-bar input { background: #161b22; border: 1px solid var(--border); color: var(--fg); padding: .5rem .75rem; border-radius: 6px; width: 260px; }
    .filter-bar select { background: #161b22; border: 1px solid var(--border); color: var(--fg); padding: .5rem; border-radius: 6px; }
    table { border-collapse: collapse; width: 100%; }
    th, td { border: 1px solid var(--border); padding: .5rem .75rem; text-align: left; font-size: .875rem; }
    th { background: #161b22; position: sticky; top: 0; }
    tr:hover { background: #161b2266; }
    .mono { font-family: 'SF Mono', 'Fira Code', monospace; font-size: .8rem; }
    .success { color: var(--green); font-weight: 600; }
    .failed { color: var(--red); font-weight: 600; }
  </style>
</head>
<body>
  <h1>Model Photo Upload Report</h1>
  <p class="meta">
    Generated: ${new Date().toISOString()} |
    Duration: ${meta.elapsed}s |
    Total: ${report.length} | Success: ${successCount} | Failed: ${failCount} |
    Compression: ${formatBytes(meta.totalOriginal)} -> ${formatBytes(meta.totalCompressed)} (saved ${formatBytes(meta.totalOriginal - meta.totalCompressed)})
  </p>
  <div class="filter-bar">
    <input type="text" id="search" placeholder="Filter by name..." oninput="filterTable()">
    <select id="statusFilter" onchange="filterTable()">
      <option value="">All statuses</option>
      <option value="Success">Success</option>
      <option value="Failed">Failed</option>
    </select>
  </div>
  <table>
    <thead>
      <tr>
        <th>Model Name</th>
        <th>ID</th>
        <th>Status</th>
        <th>Details</th>
      </tr>
    </thead>
    <tbody id="tbody">
      ${rows}
    </tbody>
  </table>
  <script>
    function filterTable() {
      const q = document.getElementById('search').value.toLowerCase();
      const s = document.getElementById('statusFilter').value;
      document.querySelectorAll('#tbody tr').forEach(tr => {
        const name = tr.children[0].textContent.toLowerCase();
        const status = tr.children[2].textContent;
        tr.style.display = (name.includes(q) && (!s || status === s)) ? '' : 'none';
      });
    }
  </script>
</body>
</html>`;

  const reportPath = `upload-report-${new Date().toISOString().slice(0, 10)}.html`;
  fs.writeFileSync(reportPath, html);
  console.log(`Report: ${reportPath}`);
}

// ======================================================================
// Helpers
// ======================================================================

function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / k ** i).toFixed(1)} ${sizes[i]}`;
}

function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ======================================================================
// Entry point
// ======================================================================

main().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
