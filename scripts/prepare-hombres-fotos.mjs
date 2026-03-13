/**
 * prepare-hombres-fotos.mjs
 * 
 * Este script corre LOCALMENTE. 
 * Su única función es organizar las carpetas de los modelos hombres para que 
 * tengan la misma estructura que las mujeres:
 * 
 * Antes:
 * {ModelName}/ficha/ 
 *   |-- foto1.jpg
 *   |-- foto2.jpg
 * 
 * Después:
 * {ModelName}/ficha/
 *   |-- portada/
 *   |     |-- mejor_foto_rostro.jpg  <-- (Auto-detectada)
 *   |-- foto1.jpg
 *   |-- foto2.jpg
 * 
 * Regla: Si hay 3 fotos o menos en "ficha", no crea portada (todas quedan en ficha).
 * 
 * Uso:
 * node scripts/prepare-hombres-fotos.mjs --dir="C:\Users\Evo-minidesk\Downloads\Hombres"
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

// Face detection dependencies
import { Canvas, Image, ImageData } from '@napi-rs/canvas';
import * as faceapi from 'face-api.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const DRY_RUN = process.argv.includes('--dry-run');
const VERBOSE = process.argv.includes('--verbose');

function getArgValue(name) {
  const arg = process.argv.find((a) => a.startsWith(`--${name}=`));
  return arg ? arg.split('=')[1] ?? null : null;
}

const BASE_DIR = getArgValue('dir') ?? 'C:\\Users\\Evo-minidesk\\Downloads\\Hombres';
const FILTER_MODELS = getArgValue('models')?.split(',').map((s) => s.trim().toLowerCase()) ?? null;
const IMAGE_EXTENSIONS = /\.(jpg|jpeg|png|webp|tiff|avif)$/i;

// ======================================================================
// face-api.js setup
// ======================================================================
faceapi.env.monkeyPatch({ Canvas, Image, ImageData });

let modelsLoaded = false;
async function loadFaceModels() {
  if (modelsLoaded) return;
  const modelsPath = path.join(__dirname, 'models');
  if (VERBOSE) console.log(`Cargando modelos de IA desde ${modelsPath}...`);
  await faceapi.nets.tinyFaceDetector.loadFromDisk(modelsPath);
  modelsLoaded = true;
}

async function getFaceRatio(imagePath) {
  try {
    const processedBuffer = await sharp(imagePath)
      .rotate() 
      .jpeg() 
      .toBuffer();

    const img = new Image();
    img.src = processedBuffer;

    if (img.width === 0 || img.height === 0) return 0;

    const detections = await faceapi.detectAllFaces(img, new faceapi.TinyFaceDetectorOptions());
    if (!detections || detections.length === 0) return 0;

    let maxFaceArea = 0;
    for (const det of detections) {
      const faceArea = det.box.width * det.box.height;
      if (faceArea > maxFaceArea) {
        maxFaceArea = faceArea;
      }
    }

    const imgArea = img.width * img.height;
    return maxFaceArea / imgArea;
  } catch (err) {
    if (VERBOSE) console.warn(`Error al detectar rostro en ${path.basename(imagePath)}: ${err.message}`);
    return 0;
  }
}

// ======================================================================
// File System Helpers
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

function getFichaPath(modelPath) {
  const possibleNames = ['Ficha', 'ficha'];
  for (const name of possibleNames) {
    const fullPath = path.join(modelPath, name);
    if (fs.existsSync(fullPath)) return fullPath;
  }
  return null;
}

// ======================================================================
// Procesar un Modelo
// ======================================================================
async function processModel(folderName) {
  const modelPath = path.join(BASE_DIR, folderName);
  const fichaPath = getFichaPath(modelPath);

  if (!fichaPath) {
    console.log(`  [SKIP] ${folderName} - No tiene carpeta Ficha/ficha`);
    return false;
  }

  const portadaPath = path.join(fichaPath, 'portada');
  if (fs.existsSync(portadaPath) && listImages(portadaPath).length > 0) {
    console.log(`  [OK] ${folderName} - Ya tiene portada/ configurada.`);
    return true;
  }

  const fichaFiles = listImages(fichaPath);

  if (fichaFiles.length === 0) {
    console.log(`  [SKIP] ${folderName} - Ficha vacía.`);
    return false;
  }

  // Regla: <= 3 fotos, no crear portada
  if (fichaFiles.length <= 3) {
    console.log(`  [INFO] ${folderName} - Solo ${fichaFiles.length} fotos. Omitiendo portada.`);
    return true;
  }

  // Cargar modelos de IA solo cuando sean necesarios
  await loadFaceModels();

  let maxRatio = -1;
  let bestCoverIndex = 0;

  for (let i = 0; i < fichaFiles.length; i++) {
    const fullPath = path.join(fichaPath, fichaFiles[i]);
    const ratio = await getFaceRatio(fullPath);
    
    if (ratio > maxRatio) {
      maxRatio = ratio;
      bestCoverIndex = i;
    }
  }

  const coverFile = fichaFiles[bestCoverIndex];
  const sourcePath = path.join(fichaPath, coverFile);
  const targetPath = path.join(portadaPath, coverFile);

  if (!DRY_RUN) {
    if (!fs.existsSync(portadaPath)) {
      fs.mkdirSync(portadaPath, { recursive: true });
    }
    // Mover archivo
    fs.renameSync(sourcePath, targetPath);
  }

  console.log(`  [DONE] ${folderName} - Portada seleccionada: ${coverFile} (Ratio: ${(maxRatio * 100).toFixed(1)}%)`);
  return true;
}

// ======================================================================
// Main
// ======================================================================
async function main() {
  console.log('==========================================================');
  console.log('       Preparar Carpetas Hombres (Auto-Portada local)     ');
  console.log('==========================================================');
  console.log(`  Modo:        ${DRY_RUN ? 'DRY RUN (no mueve archivos)' : 'LIVE'}`);
  console.log(`  Directorio:  ${BASE_DIR}`);
  console.log('');

  if (!fs.existsSync(BASE_DIR)) {
    console.error(`Error: No existe el directorio: ${BASE_DIR}`);
    process.exit(1);
  }

  let folders = fs
    .readdirSync(BASE_DIR)
    .filter((f) => fs.statSync(path.join(BASE_DIR, f)).isDirectory());

  if (FILTER_MODELS) {
    folders = folders.filter((f) => FILTER_MODELS.includes(f.toLowerCase().trim()));
    console.log(`  Filtro: Procesando solo ${folders.length} modelos\n`);
  }

  console.log(`Encontrados ${folders.length} modelos para analizar...\n`);

  let count = 0;
  for (const folder of folders) {
    const success = await processModel(folder);
    if (success) count++;
  }

  console.log('\n==========================================================');
  console.log(`  Proceso terminado. Analizados ${count}/${folders.length} modelos.`);
  console.log('==========================================================\n');
}

main().catch(err => {
  console.error("Error fatal:", err);
  process.exit(1);
});
