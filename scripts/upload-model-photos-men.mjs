#!/usr/bin/env node

/**
 * upload-model-photos-men.mjs
 *
 * Bulk upload script for male model photos -> Cloudflare R2 + Supabase DB.
 *
 * --- MALE MODEL DIFFERENCES ---
 * The assistant did NOT create a "portada" (cover) subfolder. All comp-card photos
 * are in the "ficha" folder together.
 *
 * This script uses face-api.js to AUTO-DETECT the best cover photo:
 * 1. Analyzes all photos in "ficha/"
 * 2. Calculates faceRatio = (face area / image area)
 * 3. The photo with the largest faceRatio (most close-up) is chosen as COVER
 * 4. The rest become COMP-CARD photos
 * 5. If a model has <= 3 photos in "ficha/", NO cover is chosen.
 *
 * --- FOLDER STRUCTURE ---
 * C:\Users\Evo-minidesk\Downloads\Hombres\{ModelName}\
 *   |-- ficha/          -> Comp-card photos + Cover (auto-selected)
 *   \-- *.jpg|png|webp  -> Portfolio gallery (DISPLAY quality)
 *
 * Usage:
 *   node scripts/upload-model-photos-men.mjs [options]
 *
 * Options:
 *   --dry-run        Simulate without uploading
 *   --concurrency=N  Number of parallel workers (default: 3, max: 10)
 *   --dir=PATH       Override base directory (defaults to Hombres folder)
 *   --verbose        Show detailed per-file logs
 *   --models=a,b,c   Process only these model folder names
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { S3Client, PutObjectCommand, DeleteObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { createClient } from '@supabase/supabase-js';
import sharp from 'sharp';
import dotenv from 'dotenv';

// Face detection dependencies
import { Canvas, Image, ImageData } from '@napi-rs/canvas';
import * as faceapi from 'face-api.js';

dotenv.config({ path: '.env.local' });

const __dirname = path.dirname(fileURLToPath(import.meta.url));

import fetch from 'node-fetch';

// ======================================================================
// face-api.js setup
// ======================================================================

// Patch node environment for face-api
faceapi.env.monkeyPatch({ Canvas, Image, ImageData });

let modelsLoaded = false;
async function loadFaceModels() {
  if (modelsLoaded) return;
  const modelsPath = path.join(__dirname, 'models');
  if (VERBOSE) console.log(`Loading face-api models from ${modelsPath}...`);
  await faceapi.nets.ssdMobilenetv1.loadFromDisk(modelsPath);
  modelsLoaded = true;
}

/**
 * Detects faces and returns the proportion of the image area the largest face occupies.
 * Handles EXIF rotation automatically via sharp before detection.
 */
async function getFaceRatio(imagePath) {
  try {
    // 1. Process image with sharp first to handle EXIF rotation and ensure standard format for canvas
    // Canvas doesn't respect EXIF orientation, which breaks face detection
    const processedBuffer = await sharp(imagePath)
      .rotate() // Auto-rotate based on EXIF
      .jpeg() // Convert to standard format for canvas
      .toBuffer();

    // 2. Load into canvas Image
    const img = new Image();
    img.src = processedBuffer;

    if (img.width === 0 || img.height === 0) return 0; // Failed to load

    // 3. Detect faces
    const detections = await faceapi.detectAllFaces(img);
    if (!detections || detections.length === 0) return 0;

    // 4. Find the largest face by area
    let maxFaceArea = 0;
    for (const det of detections) {
      const faceArea = det.box.width * det.box.height;
      if (faceArea > maxFaceArea) {
        maxFaceArea = faceArea;
      }
    }

    // 5. Calculate ratio
    const imgArea = img.width * img.height;
    return maxFaceArea / imgArea;
  } catch (err) {
    if (VERBOSE) console.warn(`Face detection failed for ${path.basename(imagePath)}: ${err.message}`);
    return 0; // Fallback to 0 if detection fails
  }
}

// ======================================================================
// Configuration & validation
// ======================================================================

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
  return arg ? arg.split('=')[1] ?? null : null;
}

const CONCURRENCY = Math.min(Math.max(parseInt(getArgValue('concurrency') ?? '3', 10) || 3, 1), 10);
const BASE_DIR = getArgValue('dir') ?? 'C:\\Users\\Evo-minidesk\\Downloads\\Hombres';
const FILTER_MODELS = getArgValue('models')?.split(',').map((s) => s.trim().toLowerCase()) ?? null;

const IMAGE_EXTENSIONS = /\.(jpg|jpeg|png|webp|tiff|avif)$/i;

// ======================================================================
// Two-tier compression presets
// ======================================================================

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

const supabase = createClient(REQUIRED_ENV.NEXT_PUBLIC_SUPABASE_URL, REQUIRED_ENV.SUPABASE_SERVICE_KEY, {
  global: { fetch: fetch }
});

// ======================================================================
// Retry utility
// ======================================================================

const MAX_RETRIES = 3;
const BASE_DELAY_MS = 500;

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

async function deleteOldFiles(modelId, category, slotIndex = null) {
  if (DRY_RUN) return;

  const prefix = `${modelId}/${category}/`;
  const searchPrefix = category === 'Contraportada' && slotIndex !== null ? `${prefix}comp_${slotIndex}_` : prefix;

  const listCommand = new ListObjectsV2Command({
    Bucket: REQUIRED_ENV.R2_BUCKET_NAME,
    Prefix: searchPrefix,
  });

  const listedObjects = await withRetry(() => r2.send(listCommand), `list ${searchPrefix}`);

  if (!listedObjects.Contents?.length) return;

  for (const obj of listedObjects.Contents) {
    if (!obj.Key) continue;
    await withRetry(
      () => r2.send(new DeleteObjectCommand({ Bucket: REQUIRED_ENV.R2_BUCKET_NAME, Key: obj.Key })),
      `delete ${obj.Key}`
    );
  }
}

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

/**
 * Handle variations in the casing of 'Ficha' folder
 */
function getFichaPath(modelPath) {
  const possibleNames = ['Ficha', 'ficha'];
  for (const name of possibleNames) {
    const fullPath = path.join(modelPath, name);
    if (fs.existsSync(fullPath)) return fullPath;
  }
  return null;
}

// ======================================================================
// Auto-Cover Logic
// ======================================================================

/**
 * Split ficha files into cover and comp cards.
 * @returns {Promise<{ coverFile: string | null; remainingFiles: string[] }>}
 */
async function selectCoverPhoto(fichaFiles, fichaDirPath) {
  if (fichaFiles.length === 0) return { coverFile: null, remainingFiles: [] };
  
  // Rule: If <= 3 photos, NO cover. All go to contraportada.
  if (fichaFiles.length <= 3) {
    if (VERBOSE) console.log(`    Only ${fichaFiles.length} photos in Ficha. Skipping cover selection.`);
    return { coverFile: null, remainingFiles: fichaFiles };
  }

  // Load models if not loaded yet
  await loadFaceModels();

  let maxRatio = -1;
  let bestCoverIndex = 0; // Fallback to first file

  if (VERBOSE) console.log(`    Analyzing ${fichaFiles.length} photos for best cover...`);

  for (let i = 0; i < fichaFiles.length; i++) {
    const fullPath = path.join(fichaDirPath, fichaFiles[i]);
    const ratio = await getFaceRatio(fullPath);
    
    if (VERBOSE) {
      console.log(`      - ${fichaFiles[i]}: Face Ratio = ${(ratio * 100).toFixed(2)}%`);
    }

    if (ratio > maxRatio) {
      maxRatio = ratio;
      bestCoverIndex = i;
    }
  }

  const coverFile = fichaFiles[bestCoverIndex];
  const remainingFiles = fichaFiles.filter((_, idx) => idx !== bestCoverIndex);
  
  if (VERBOSE) {
    console.log(`    [SELECT] Selected ${coverFile} as cover (Ratio: ${(maxRatio * 100).toFixed(2)}%)`);
  }

  return { coverFile, remainingFiles };
}

// ======================================================================
// Per-model processing
// ======================================================================

async function processModel(modelName, modelId) {
  const modelPath = path.join(BASE_DIR, modelName);
  const fichaPath = getFichaPath(modelPath);

  const result = {
    name: modelName,
    id: modelId,
    cover: null,
    compcards: [null, null, null, null],
    portfolio: [],
    status: 'Success',
    reason: '',
    stats: { printFiles: 0, displayFiles: 0, totalOriginalBytes: 0, totalCompressedBytes: 0 },
    faceDetectionNotes: ''
  };

  try {
    let fichaFiles = [];
    if (fichaPath) {
      fichaFiles = listImages(fichaPath);
    }

    // ========== 1. AUTO-DETECT COVER (Portada) ==========
    const { coverFile, remainingFiles } = await selectCoverPhoto(fichaFiles, fichaPath);
    
    // Process Cover - PRINT tier
    if (coverFile) {
      const ts = Date.now();
      const { buffer, originalSize, compressedSize } = await compressImage(
        path.join(fichaPath, coverFile),
        'print'
      );
      await deleteOldFiles(modelId, 'Portada');
      result.cover = await uploadToR2(buffer, modelId, 'Portada', `${ts}-cover.webp`);
      result.stats.printFiles++;
      result.stats.totalOriginalBytes += originalSize;
      result.stats.totalCompressedBytes += compressedSize;
      result.faceDetectionNotes = `Selected ${coverFile} as cover (Close-up auto-detected).`;
    } else {
      result.faceDetectionNotes = fichaFiles.length > 0 ? "Skipped cover (<= 3 photos total)." : "No ficha folder found.";
    }

    // ========== 2. COMP CARDS (Ficha) -- PRINT tier ==========
    // Use the remaining files after selecting cover
    const compFiles = remainingFiles.slice(0, 3);
    const TARGET_SLOTS = [0, 2, 3];

    for (let i = 0; i < compFiles.length; i++) {
      const slotIndex = TARGET_SLOTS[i];
      const ts = Date.now() + i;
      const { buffer, originalSize, compressedSize } = await compressImage(
        path.join(fichaPath, compFiles[i]),
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
    const portfolioFiles = listImages(modelPath);

    if (portfolioFiles.length > 0) {
      await deleteOldFiles(modelId, 'PortfolioGallery');

      for (let i = 0; i < portfolioFiles.length; i++) {
        const ts = Date.now() + i + 100;
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

    // ========== 4. DATABASE UPDATE ==========
    if (!DRY_RUN) {
      const updateData = {};

      if (result.cover) updateData.cover_path = result.cover;

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

function normalize(s) {
  return (s ?? '').toLowerCase().trim().replace(/\s+/g, ' ');
}

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
  console.log('       Male Model Photo Bulk Upload (Auto-Cover)          ');
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

  const { data: allModels, error: dbError } = await supabase.from('models').select('id, full_name, alias');
  if (dbError) {
    console.error(`Failed to fetch models from DB:`, dbError);
    process.exit(1);
  }

  console.log(`  Found ${folders.length} folder(s), ${allModels.length} model(s) in DB.\n`);

  let nextIndex = 0;
  const report = [];

  const workers = Array.from({ length: CONCURRENCY }, async () => {
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
          : `Cover: ${r.cover ? 'Yes' : 'No'} (${r.faceDetectionNotes}), CompCards: ${r.compcards?.filter(Boolean).length ?? 0}, Portfolio: ${r.portfolio?.length ?? 0}` +
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
  <title>Male Upload Report (Auto-Cover)</title>
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
  <h1>Male Photo Upload Report (Auto-Cover)</h1>
  <p class="meta">
    Generated: ${new Date().toISOString()} |
    Duration: ${meta.elapsed}s |
    Total: ${report.length} | Success: ${successCount} | Failed: ${failCount} |
    Compression: ${formatBytes(meta.totalOriginal)} -> ${formatBytes(meta.totalCompressed)}
  </p>
  <div class="filter-bar">
    <input type="text" id="search" placeholder="Filter by name..." oninput="filterTable()">
    <select id="statusFilter" onchange="filterchange()">
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

  const reportPath = path.join(__dirname, '..', `upload-men-report-${new Date().toISOString().slice(0, 10)}.html`);
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
