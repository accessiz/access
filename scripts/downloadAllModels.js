// downloadAllModels.js
const fs = require('fs').promises;
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

// --- CONFIGURACIÓN ---
dotenv.config({ path: path.resolve(__dirname, '.env.local') });

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_KEY;
const BUCKET_NAME = 'Book_Completo_iZ_Management'; // Tu bucket

// Carpeta principal donde se guardará todo
const BASE_DOWNLOAD_FOLDER = path.resolve(__dirname, 'portafolio_web');
// --- FIN DE LA CONFIGURACIÓN ---

// Validar conexión
if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('[ERROR] Faltan variables de entorno SUPABASE_URL o SUPABASE_KEY.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

/**
 * Limpia un string para usarlo de forma segura en un CSV.
 */
const escapeCsv = (str) => {
  if (str === null || str === undefined) return '""';
  return `"${String(str).replace(/"/g, '""')}"`;
};

/**
 * Función helper para descargar un archivo.
 * Devuelve true si tuvo éxito, false si falló.
 */
async function downloadFile(supabasePath, localPath) {
  try {
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .download(supabasePath);

    if (error) throw error; // Lanza error si no se encuentra

    const buffer = Buffer.from(await data.arrayBuffer());
    await fs.writeFile(localPath, buffer);
    console.log(`  [ÉXITO] Guardado en: ${localPath}`);
    return true; // Éxito
    
  } catch (err) {
    console.error(`  [FALLO] No se pudo descargar "${supabasePath}": ${err.message}`);
    return false; // Fallo
  }
}

/**
 * Función principal para descargar todo
 */
async function downloadAllModels() {
  console.log('[INFO] Iniciando descarga masiva de portafolios...');
  
  // Array para guardar los datos del reporte CSV
  const reportData = [];

  // 1. Obtener TODOS los modelos de la DB
  console.log('[INFO] Obteniendo lista de modelos de la base de datos...');
  
  // --- CORRECCIÓN 1 ---
  // Cambiado 'foto_portada' por 'cover_path'
  const { data: models, error: dbError } = await supabase
    .from('models')
    .select('id, alias, cover_path, portfolio_path');

  if (dbError) {
    console.error(`[ERROR] No se pudo obtener la lista de modelos: ${dbError.message}`);
    return;
  }

  console.log(`[INFO] Se encontraron ${models.length} modelos. Iniciando procesamiento...`);

  // 2. Crear la carpeta base principal
  try {
    await fs.mkdir(BASE_DOWNLOAD_FOLDER, { recursive: true });
  } catch (mkdirError) {
    console.error(`[ERROR] No se pudo crear la carpeta base "${BASE_DOWNLOAD_FOLDER}": ${mkdirError.message}`);
    return;
  }

  // 3. Iterar sobre cada modelo y descargar
  for (const model of models) {
    if (!model.alias) {
      console.warn(`[AVISO] Modelo con ID ${model.id} no tiene 'alias'. Omitiendo.`);
      continue;
    }

    console.log(`\n--- Procesando: ${model.alias} (ID: ${model.id}) ---`);
    
    // Preparar la fila del reporte
    const reportEntry = {
      nombre: model.alias,
      portada: 'No',
      portafolio: 'No'
    };

    // Crear la carpeta individual del modelo
    const safeFolderName = model.alias.replace(/[\/\\:*?"<>|]/g, '-');
    const modelFolder = path.join(BASE_DOWNLOAD_FOLDER, safeFolderName);

    try {
      await fs.mkdir(modelFolder, { recursive: true });
    } catch (mkdirError) {
      console.error(`  [FALLO] No se pudo crear la carpeta para ${model.alias}: ${mkdirError.message}`);
      reportData.push(reportEntry); // Añadir al reporte aunque falle
      continue; // Saltar al siguiente modelo
    }

    // --- Descargar Foto de Portada ---
    // --- CORRECCIÓN 2 ---
    // Cambiado 'model.foto_portada' por 'model.cover_path'
    const coverPath = model.cover_path; 
    if (coverPath) {
      const extension = path.extname(coverPath) || '.webp'; 
      const localFileName = `portada${extension}`;
      const success = await downloadFile(coverPath, path.join(modelFolder, localFileName));
      if (success) {
        reportEntry.portada = 'Sí';
      }
    } else {
      // --- CORRECCIÓN 3 ---
      // Cambiado 'foto_portada' por 'cover_path'
      console.log("  [INFO] Modelo sin 'cover_path'.");
    }

    // --- Descargar Foto de Portafolio (Esta ya estaba bien) ---
    const portfolioPath = model.portfolio_path;
    if (portfolioPath) {
      const extension = path.extname(portfolioPath) || '.webp';
      const localFileName = `portafolio${extension}`;
      const success = await downloadFile(portfolioPath, path.join(modelFolder, localFileName));
      if (success) {
        reportEntry.portafolio = 'Sí';
      }
    } else {
      console.log("  [INFO] Modelo sin 'portfolio_path'.");
    }

    // Añadir la fila completa al reporte
    reportData.push(reportEntry);
  }

  console.log('\n--- Proceso de descarga completado ---');

  // 4. Generar el archivo CSV
  console.log('[INFO] Generando reporte CSV...');
  
  const csvHeaders = [
    'Nombre de modelo',
    'Portada',
    'Portafolio'
  ].map(escapeCsv).join(',');

  const csvRows = reportData.map(row => {
    return [
      escapeCsv(row.nombre),
      escapeCsv(row.portada),
      escapeCsv(row.portafolio)
    ].join(',');
  }).join('\n');

  const csvContent = `${csvHeaders}\n${csvRows}`;
  const reportFileName = 'reporte_descargas.csv';

  try {
    await fs.writeFile(path.join(__dirname, reportFileName), csvContent);
    console.log(`[ÉXITO] Reporte de descargas guardado en: ${reportFileName}`);
  } catch (err) {
    console.error(`[ERROR] No se pudo guardar "${reportFileName}": ${err.message}`);
  }

  console.log('\n[INFO] Script finalizado.');
}

// Ejecutar el script
downloadAllModels();