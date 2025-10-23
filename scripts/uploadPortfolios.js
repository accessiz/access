// uploadPortfolios.js
const fs = require('fs').promises;
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const sharp = require('sharp');
const dotenv = require('dotenv');

// --- CONFIGURACIÓN ---
dotenv.config({ path: path.resolve(__dirname, '.env.local') });

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_KEY; 

const IMAGE_FOLDER = 'C:/Users/Evo-minidesk/Downloads/FICHAS CANVA 2025-20251023T053436Z-1-001';
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

// --- CAMBIO: Función de reporte unificada ---
/**
 * Limpia un string para usarlo de forma segura en un CSV (escapa comillas).
 */
const escapeCsv = (str) => {
  if (str === null || str === undefined) return '""';
  // Reemplaza comillas dobles con dos comillas dobles y envuelve todo en comillas
  return `"${String(str).replace(/"/g, '""')}"`;
};

/**
 * Genera un único archivo CSV de reporte.
 * @param {Array<object>} reportData - Datos de los modelos de la DB Y de archivos huérfanos.
 */
async function generateSingleCsvReport(reportData) {
  console.log('\n[INFO] Generando reporte CSV unificado...');
  
  // Encabezados unificados para el reporte
  const csvHeaders = [
    'ID Modelo',
    'Alias (DB) / Nombre Archivo (Local)',
    'Portfolio Path (DB)',
    'Imagen Local Encontrada',
    'Ruta Completa Local',
    'Estado Final del Script'
  ].map(escapeCsv).join(',');

  // Mapea las filas del array de reporte
  const csvRows = reportData.map(row => {
    return [
      escapeCsv(row.id),
      escapeCsv(row.alias),
      escapeCsv(row.portfolio_original),
      escapeCsv(row.imagen_local_encontrada),
      escapeCsv(row.ruta_local),
      escapeCsv(row.estado_script)
    ].join(',');
  }).join('\n');

  const csvContent = `${csvHeaders}\n${csvRows}`;
  const reportFileName = 'reporte_completo_portfolios.csv';

  try {
    await fs.writeFile(reportFileName, csvContent);
    console.log(`[ÉXITO] Reporte completo guardado en: ${reportFileName}`);
  } catch (err) {
    console.error(`[ERROR] No se pudo guardar "${reportFileName}": ${err.message}`);
  }
}
// --- FIN DEL CAMBIO ---


if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('[ERROR] Faltan variables en tu archivo .env.local.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function processUploads() {
  console.log('Iniciando proceso de carga y optimización...');

  // --- ARRAYS PARA REPORTES ---
  const reportData = []; // Para el reporte unificado
  const usedLocalNormalizedNames = new Set(); // Para encontrar archivos huérfanos
  // --- FIN ARRAYS PARA REPORTES ---

  // --- PASO 1: Mapear todos los archivos de imágenes locales (recursivamente) ---
  const imageMap = new Map();
  try {
    const allFilePaths = await getAllFilesRecursive(IMAGE_FOLDER);
    for (const filePath of allFilePaths) {
      const fileName = path.basename(filePath); 
      const normalized = normalizeName(fileName);
      if (normalized) {
        imageMap.set(normalized, filePath);
      }
    }
  } catch (err) {
    console.error(`[ERROR] No se pudo leer la carpeta: "${IMAGE_FOLDER}".`);
    console.error(err.message);
    return;
  }

  console.log(`[INFO] Encontrados ${imageMap.size} archivos de imagen en "${IMAGE_FOLDER}" y sus subcarpetas.`);
  if (imageMap.size === 0) {
    console.error('[ERROR] No se encontraron imágenes.');
    return;
  }

  // --- PASO 2: Obtener TODOS los modelos de la DB ---
  console.log('Obteniendo modelos de la base de datos...');
  const { data: models, error: dbError } = await supabase
    .from('models')
    .select('id, alias, portfolio_path');

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
    
    // Objeto base para el reporte de este modelo
    const reportEntry = {
      id: model.id,
      alias: model.alias,
      portfolio_original: model.portfolio_path || 'VACÍO',
      imagen_local_encontrada: 'No',
      ruta_local: 'N/A',
      estado_script: 'N/A'
    };

    if (imageMap.has(normalizedAlias)) {
      // Sí hay coincidencia
      const localImagePath = imageMap.get(normalizedAlias);
      uploadQueue.push({
        modelId: model.id,
        alias: model.alias,
        localImagePath: localImagePath
      });

      // Actualizar reporte
      reportEntry.imagen_local_encontrada = 'Sí';
      reportEntry.ruta_local = localImagePath;
      reportEntry.estado_script = 'En cola para actualizar/subir';
      usedLocalNormalizedNames.add(normalizedAlias); // Marcar este archivo local como "usado"

    } else {
      // No se encontró imagen local para este modelo
      reportEntry.estado_script = 'Sin imagen local coincidente';
    }
    
    reportData.push(reportEntry); // Añadir la fila del modelo de DB al reporte
  }

  console.log(`\n[INFO] Se van a procesar ${uploadQueue.length} cargas/actualizaciones. Iniciando...`);

  // --- PASO 4: Procesar la cola de carga ---
  let successCount = 0;
  let failCount = 0;

  for (const item of uploadQueue) {
    // Buscar la entrada del reporte para este item y actualizar su estado
    const reportEntry = reportData.find(r => r.id === item.modelId);

    try {
      const originalFileBuffer = await fs.readFile(item.localImagePath);
      const processedBuffer = await sharp(originalFileBuffer)
        .webp({ quality: 80 })
        .toBuffer();

      const supabasePath = `${item.modelId}/Portfolio/portfolio.webp`;

      const { error: uploadError } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(supabasePath, processedBuffer, {
          cacheControl: '3600',
          upsert: true, 
          contentType: 'image/webp'
        });

      if (uploadError) {
        throw new Error(`Error de Storage: ${uploadError.message}`);
      }

      const { error: updateError } = await supabase
        .from('models')
        .update({ portfolio_path: supabasePath }) 
        .eq('id', item.modelId);

      if (updateError) {
        throw new Error(`Error de DB Update: ${updateError.message}`);
      }

      console.log(`[ÉXITO] ${item.alias} -> ${supabasePath}`);
      successCount++;
      if (reportEntry) reportEntry.estado_script = 'Éxito - Subido/Actualizado'; 

    } catch (err) {
      console.error(`[FALLO] ${item.alias}: ${err.message || 'Error desconocido'}`);
      failCount++;
      if (reportEntry) reportEntry.estado_script = `FALLO - ${err.message}`;
  }
  }

  // --- PASO 5: Añadir archivos locales "huérfanos" al reporte ---
  console.log('[INFO] Buscando archivos locales sin uso (huérfanos)...');
  let orphanCount = 0;
  for (const [normalizedName, fullPath] of imageMap.entries()) {
    // Si este nombre normalizado NO fue usado por ningún modelo de la DB...
    if (!usedLocalNormalizedNames.has(normalizedName)) {
      const fileName = path.basename(fullPath);
      // ...lo añadimos al reporte.
      reportData.push({
        id: 'N/A (Local)',
        alias: fileName, // Usamos el nombre de archivo original
        portfolio_original: 'N/A',
        imagen_local_encontrada: 'Sí',
        ruta_local: fullPath,
        estado_script: 'Archivo local sin uso (huérfano)'
      });
      orphanCount++;
    }
  }
  if (orphanCount > 0) {
    console.log(`[INFO] Se encontraron ${orphanCount} archivos locales huérfanos.`);
  }

  // --- PASO 6: Generar Reporte CSV Único ---
  await generateSingleCsvReport(reportData);

  console.log('\n[INFO] Proceso completado.');
  console.log(`[RESUMEN] Éxitos: ${successCount}, Fallos: ${failCount}`);
}

// Ejecutar el script
processUploads();