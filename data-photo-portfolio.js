// downloadOnlyReport.js
const fs = require('fs').promises;
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

// --- CONFIGURACIÓN ---
dotenv.config({ path: path.resolve(__dirname, '.env.local') });

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_KEY;
// const BUCKET_NAME = 'Book_Completo_iZ_Management'; // No es necesario si no descargamos
// const BASE_DOWNLOAD_FOLDER = path.resolve(__dirname, 'portafolio_web'); // No es necesario
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
 * Función principal para generar el reporte CSV
 */
async function generateReport() {
  console.log('[INFO] Iniciando generación de reporte de portafolios...');
  
  // Array para guardar los datos del reporte CSV
  const reportData = [];

  // 1. Obtener TODOS los modelos de la DB
  console.log('[INFO] Obteniendo lista de modelos de la base de datos...');
  
  const { data: models, error: dbError } = await supabase
    .from('models')
    .select('id, alias, cover_path, portfolio_path'); // Seleccionamos los paths para reportar

  if (dbError) {
    console.error(`[ERROR] No se pudo obtener la lista de modelos: ${dbError.message}`);
    return;
  }

  console.log(`[INFO] Se encontraron ${models.length} modelos. Iniciando procesamiento...`);

  // 2. Iterar sobre cada modelo y registrar su estado
  for (const model of models) {
    if (!model.alias) {
      console.warn(`[AVISO] Modelo con ID ${model.id} no tiene 'alias'. Omitiendo.`);
      continue;
    }

    console.log(`--- Procesando: ${model.alias} (ID: ${model.id}) ---`);
    
    // Revisar si los paths existen en la base de datos
    const hasCover = !!model.cover_path;
    const hasPortfolio = !!model.portfolio_path;

    if (hasCover) {
        console.log("  [INFO] 'cover_path' registrado.");
    } else {
        console.log("  [AVISO] Modelo sin 'cover_path'.");
    }

    if (hasPortfolio) {
        console.log("  [INFO] 'portfolio_path' registrado.");
    } else {
        console.log("  [AVISO] Modelo sin 'portfolio_path'.");
    }

    // Añadir la fila completa al reporte
    reportData.push({
      nombre: model.alias,
      portada: hasCover ? 'Sí' : 'No', // Reporta 'Sí' si el path existe
      portafolio: hasPortfolio ? 'Sí' : 'No' // Reporta 'Sí' si el path existe
    });
  }

  console.log('\n--- Proceso de revisión completado ---');

  // 3. Generar el archivo CSV
  console.log('[INFO] Generando reporte CSV...');
  
  const csvHeaders = [
    'Nombre de modelo',
    'Portada Registrada (Sí/No)', // Título actualizado para claridad
    'Portafolio Registrado (Sí/No)' // Título actualizado para claridad
  ].map(escapeCsv).join(',');

  const csvRows = reportData.map(row => {
    return [
      escapeCsv(row.nombre),
      escapeCsv(row.portada),
      escapeCsv(row.portafolio)
    ].join(',');
  }).join('\n');

  const csvContent = `${csvHeaders}\n${csvRows}`;
  const reportFileName = 'reporte_existencia_portafolios.csv'; // Nuevo nombre de archivo

  try {
    await fs.writeFile(path.join(__dirname, reportFileName), csvContent);
    console.log(`[ÉXITO] Reporte de existencias guardado en: ${reportFileName}`);
  } catch (err) {
    console.error(`[ERROR] No se pudo guardar "${reportFileName}": ${err.message}`);
  }

  console.log('\n[INFO] Script finalizado.');
}

// Ejecutar el script
generateReport();