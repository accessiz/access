// uploadPortfoliosAndCovers_Optimized_FixedRotation.js
const fs = require('fs').promises;
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const sharp = require('sharp');
const dotenv = require('dotenv');

// --- CONFIGURACIÓN ---
dotenv.config({ path: path.resolve(__dirname, '.env.local') });

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_KEY; 

const IMAGE_FOLDER_BASE = 'C:/Users/Evo-minidesk/Downloads/material pendiente';
const COVER_FOLDER_NAME = 'cover_path'; 
const PORTFOLIO_FOLDER_NAME = 'portfolio_path';

const COVER_FOLDER = path.join(IMAGE_FOLDER_BASE, COVER_FOLDER_NAME);
const PORTFOLIO_FOLDER = path.join(IMAGE_FOLDER_BASE, PORTFOLIO_FOLDER_NAME);

const BUCKET_NAME = 'Book_Completo_iZ_Management';
// --- FIN DE LA CONFIGURACIÓN ---

const normalizeName = (name) => {
  if (!name) return '';
  return name
    .toLowerCase()
    .replace(/\.(jpg|png|jpeg|webp|avif)$/i, '') 
    .replace(/[^a-z0-9]/g, '') 
    .trim();
};

async function getAllFilesRecursive(dirPath) {
  let allFiles = [];
  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      if (entry.isDirectory()) {
        allFiles = allFiles.concat(await getAllFilesRecursive(fullPath));
      } else {
        allFiles.push(fullPath);
      }
    }
  } catch (err) {
    console.warn(`[AVISO] No se pudo leer la carpeta: ${dirPath}. Omitiendo.`);
  }
  return allFiles;
}

const escapeCsv = (str) => {
  if (str === null || str === undefined) return '""';
  return `"${String(str).replace(/"/g, '""')}"`;
};

async function generateSingleCsvReport(reportData) {
  console.log('\n[INFO] Generando reporte CSV unificado...');
  
  const csvHeaders = [
    'ID Modelo',
    'Alias (DB) / Nombre Archivo (Local)',
    'Tipo (DB/Local)',
    // Cover
    'Cover Path (DB)',
    'Cover Local Encontrado',
    'Ruta Local (Cover)',
    'Estado Script (Cover)',
    // Portfolio
    'Portfolio Path (DB)',
    'Portfolio Local Encontrado',
    'Ruta Local (Portfolio)',
    'Estado Script (Portfolio)'
  ].map(escapeCsv).join(',');

  const csvRows = reportData.map(row => {
    return [
      escapeCsv(row.id),
      escapeCsv(row.alias),
      escapeCsv(row.tipo), 
      // Cover
      escapeCsv(row.cover_db),
      escapeCsv(row.cover_local_encontrado),
      escapeCsv(row.cover_ruta_local),
      escapeCsv(row.cover_estado_script),
      // Portfolio
      escapeCsv(row.portfolio_db),
      escapeCsv(row.portfolio_local_encontrado),
      escapeCsv(row.portfolio_ruta_local),
      escapeCsv(row.portfolio_estado_script)
    ].join(',');
  }).join('\n');

  const csvContent = `${csvHeaders}\n${csvRows}`;
  const reportFileName = 'reporte_completo_covers_portfolios.csv';

  try {
    await fs.writeFile(reportFileName, csvContent);
    console.log(`[ÉXITO] Reporte completo guardado en: ${reportFileName}`);
  } catch (err) {
    console.error(`[ERROR] No se pudo guardar "${reportFileName}": ${err.message}`);
  }
}


if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('[ERROR] Faltan variables en tu archivo .env.local.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function mapImageFolder(folderPath) {
  const imageMap = new Map();
  try {
    const allFilePaths = await getAllFilesRecursive(folderPath);
    for (const filePath of allFilePaths) {
      const fileName = path.basename(filePath); 
      const normalized = normalizeName(fileName);
      if (normalized) {
        imageMap.set(normalized, filePath);
      }
    }
  } catch (err) {
    console.error(`[ERROR] No se pudo leer la carpeta: "${folderPath}".`);
    console.error(err.message);
  }
  return imageMap;
}

async function processUploads() {
  console.log('Iniciando proceso de carga y optimización...');

  const reportData = []; 
  const usedCoverNormalizedNames = new Set();
  const usedPortfolioNormalizedNames = new Set();

  // --- PASO 1: Mapear AMBAS carpetas de imágenes locales ---
  console.log(`[INFO] Mapeando Covers en: "${COVER_FOLDER}"`);
  const coverImageMap = await mapImageFolder(COVER_FOLDER);
  console.log(`[INFO] Encontrados ${coverImageMap.size} archivos de 'cover'.`);

  console.log(`[INFO] Mapeando Portfolios en: "${PORTFOLIO_FOLDER}"`);
  const portfolioImageMap = await mapImageFolder(PORTFOLIO_FOLDER);
  console.log(`[INFO] Encontrados ${portfolioImageMap.size} archivos de 'portfolio'.`);

  if (coverImageMap.size === 0 && portfolioImageMap.size === 0) {
    console.error('[ERROR] No se encontraron imágenes en ninguna de las carpetas. Abortando.');
    return;
  }

  // --- PASO 2: Obtener TODOS los modelos de la DB (con nuevas columnas) ---
  console.log('Obteniendo modelos de la base de datos...');
  const { data: models, error: dbError } = await supabase
    .from('models')
    .select('id, alias, cover_path, portfolio_path'); 

  if (dbError) {
    console.error(`[ERROR] No se pudo obtener la lista de modelos: ${dbError.message}`);
    return;
  }

  const allModelsWithAlias = models.filter(m => m.alias);
  console.log(`[INFO] Encontrados ${allModelsWithAlias.length} modelos en la DB con 'alias' para procesar.`);

  // --- PASO 3: Hacer "match" y crear una cola de carga ---
  const uploadQueue = [];
  for (const model of allModelsWithAlias) {
    const normalizedAlias = normalizeName(model.alias);
    
    const reportEntry = {
      id: model.id,
      alias: model.alias,
      tipo: 'Modelo DB',
      cover_db: model.cover_path || 'VACÍO',
      cover_local_encontrado: 'No',
      cover_ruta_local: 'N/A',
      cover_estado_script: 'N/A',
      portfolio_db: model.portfolio_path || 'VACÍO',
      portfolio_local_encontrado: 'No',
      portfolio_ruta_local: 'N/A',
      portfolio_estado_script: 'N/A'
    };

    // Match para COVER
    if (coverImageMap.has(normalizedAlias)) {
      const localImagePath = coverImageMap.get(normalizedAlias);
      uploadQueue.push({
        modelId: model.id,
        alias: model.alias,
        type: 'cover', 
        localImagePath: localImagePath
      });
      reportEntry.cover_local_encontrado = 'Sí';
      reportEntry.cover_ruta_local = localImagePath;
      reportEntry.cover_estado_script = 'En cola para subir';
      usedCoverNormalizedNames.add(normalizedAlias);
    } else {
      reportEntry.cover_estado_script = 'Sin imagen local coincidente';
    }

    // Match para PORTFOLIO
    if (portfolioImageMap.has(normalizedAlias)) {
      const localImagePath = portfolioImageMap.get(normalizedAlias);
      uploadQueue.push({
        modelId: model.id,
        alias: model.alias,
        type: 'portfolio', 
        localImagePath: localImagePath
      });
      reportEntry.portfolio_local_encontrado = 'Sí';
      reportEntry.portfolio_ruta_local = localImagePath;
      reportEntry.portfolio_estado_script = 'En cola para subir';
      usedPortfolioNormalizedNames.add(normalizedAlias);
    } else {
      reportEntry.portfolio_estado_script = 'Sin imagen local coincidente';
    }
    
    reportData.push(reportEntry);
  }

  console.log(`\n[INFO] Se van a procesar ${uploadQueue.length} cargas/actualizaciones. Iniciando...`);

  // --- PASO 4: Procesar la cola de carga (CON OPTIMIZACIÓN WEBP Y ROTACIÓN FIX) ---
  let successCount = 0;
  let failCount = 0;

  for (const item of uploadQueue) {
    const reportEntry = reportData.find(r => r.id === item.modelId);
    let supabasePath = '';
    let dbColumnToUpdate = '';
    let reportStatusField = '';

    if (item.type === 'cover') {
        supabasePath = `${item.modelId}/Cover/cover.webp`;
        dbColumnToUpdate = 'cover_path';
        reportStatusField = 'cover_estado_script';
    } else if (item.type === 'portfolio') {
        supabasePath = `${item.modelId}/Portfolio/portfolio.webp`;
        dbColumnToUpdate = 'portfolio_path';
        reportStatusField = 'portfolio_estado_script';
    } else {
        console.warn(`[AVISO] Tipo de item desconocido: ${item.type}. Omitiendo.`);
        continue;
    }

    try {
      const originalFileBuffer = await fs.readFile(item.localImagePath);

      let imageProcessor = sharp(originalFileBuffer);
      // --- INICIO DEL CAMBIO CRÍTICO: Auto-rotación según EXIF ---
      imageProcessor = imageProcessor.rotate(); // Esto lee los metadatos EXIF y rota la imagen
      // --- FIN DEL CAMBIO CRÍTICO ---

      let processedBuffer;
      const extension = path.extname(item.localImagePath).toLowerCase();

      if (extension === '.webp') {
          // Si YA es WebP, no lo recomprimas. Úsalo directamente.
          // Aquí, sharp se usó solo para la rotación, luego obtenemos el buffer sin más procesamiento.
          processedBuffer = await imageProcessor.toBuffer(); 
          console.log(`[INFO] ${item.alias} (${item.type}): Ya es WebP, omitiendo compresión extra, pero aplicando rotación.`);
      } else {
          // Si NO es WebP (jpg, png, etc.), comprímelo DESPUÉS de la rotación.
          processedBuffer = await imageProcessor
              .webp({ quality: 80 }) 
              .toBuffer();
          console.log(`[INFO] ${item.alias} (${item.type}): Comprimiendo a WebP y aplicando rotación.`);
      }
      // --- FIN DEL CAMBIO: Optimización WebP y rotación ---

      // 1. Subir a Storage
      const { error: uploadError } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(supabasePath, processedBuffer, {
          cacheControl: '3600',
          upsert: true, 
          contentType: 'image/webp' // Siempre subimos como webp
        });

      if (uploadError) {
        throw new Error(`Error de Storage (${item.type}): ${uploadError.message}`);
      }

      // 2. Actualizar la DB (columna dinámica)
      const updatePayload = {};
      updatePayload[dbColumnToUpdate] = supabasePath; 

      const { error: updateError } = await supabase
        .from('models')
        .update(updatePayload) 
        .eq('id', item.modelId);

      if (updateError) {
        throw new Error(`Error de DB Update (${item.type}): ${updateError.message}`);
      }

      console.log(`[ÉXITO] ${item.alias} (${item.type}) -> ${supabasePath}`);
      successCount++;
      if (reportEntry) reportEntry[reportStatusField] = 'Éxito - Subido/Actualizado'; 

    } catch (err) {
      console.error(`[FALLO] ${item.alias} (${item.type}): ${err.message || 'Error desconocido'}`);
      failCount++;
      if (reportEntry) reportEntry[reportStatusField] = `FALLO - ${err.message}`;
  }
  }

  // --- PASO 5: Añadir archivos locales "huérfanos" (de ambas carpetas) ---
  console.log('[INFO] Buscando archivos locales sin uso (huérfanos)...');
  let orphanCount = 0;

  // Huérfanos de COVER
  for (const [normalizedName, fullPath] of coverImageMap.entries()) {
    if (!usedCoverNormalizedNames.has(normalizedName)) {
      const fileName = path.basename(fullPath);
      reportData.push({
        id: 'N/A (Local)',
        alias: fileName,
        tipo: 'Huérfano Cover',
        cover_db: 'N/A',
        cover_local_encontrado: 'Sí',
        cover_ruta_local: fullPath,
        cover_estado_script: 'Archivo local sin uso (huérfano)',
        portfolio_db: 'N/A',
        portfolio_local_encontrado: 'N/A',
        portfolio_ruta_local: 'N/A',
        portfolio_estado_script: 'N/A',
      });
      orphanCount++;
    }
  }

  // Huérfanos de PORTFOLIO
  for (const [normalizedName, fullPath] of portfolioImageMap.entries()) {
    if (!usedPortfolioNormalizedNames.has(normalizedName)) {
      const fileName = path.basename(fullPath);
      reportData.push({
        id: 'N/A (Local)',
        alias: fileName,
        tipo: 'Huérfano Portfolio',
        cover_db: 'N/A',
        cover_local_encontrado: 'N/A',
        cover_ruta_local: 'N/A',
        cover_estado_script: 'N/A',
        portfolio_db: 'N/A',
        portfolio_local_encontrado: 'Sí',
        portfolio_ruta_local: fullPath,
        portfolio_estado_script: 'Archivo local sin uso (huérfano)',
      });
      orphanCount++;
    }
  }

  if (orphanCount > 0) {
    console.log(`[INFO] Se encontraron ${orphanCount} archivos locales huérfanos en total.`);
  }

  // --- PASO 6: Generar Reporte CSV Único ---
  await generateSingleCsvReport(reportData);

  console.log('\n[INFO] Proceso completado.');
  console.log(`[RESUMEN] Éxitos: ${successCount}, Fallos: ${failCount}`);
}

// Ejecutar el script
processUploads();