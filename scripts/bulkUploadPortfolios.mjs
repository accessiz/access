// scripts/bulkUploadPortfolios.mjs

import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import { createClient } from '@supabase/supabase-js';
import { readdir, readFile } from 'fs/promises';

// --- CONFIGURACIÓN ---
const LOCAL_COMPRESSED_PATH = 'C:\\Users\\Evo-minidesk\\Downloads\\Compcards_comprimidas';
// ✅ CORRECCIÓN: El nombre del bucket tenía un error tipográfico. Este es el correcto.
const BUCKET_NAME = 'Book_Completo_iZ_Management'; 

// Apuntamos a la carpeta 'Portfolio'
const STORAGE_FOLDER = 'Portfolio';
const STORAGE_FILE_NAME = 'portfolio';

// Carga las variables de entorno
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_KEY; 

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error(
    'Error: Faltan las variables SUPABASE_URL o SUPABASE_KEY en tu .env.local'
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

function normalizeName(name) {
  if (!name) return '';
  return name
    .toLowerCase()
    .normalize('NFD')
    // ✅ CORRECCIÓN: Esta es la forma correcta de eliminar tildes y 'ñ' para una comparación fiable.
    .replace(/[\u0300-\u036f]/g, '') 
    .trim();
}

async function runUpload() {
  console.log('🚀 Iniciando script de subida y reemplazo (V5 - Corregido)...');

  // 1. Obtener todos los modelos de la base de datos
  const { data: models, error: dbError } = await supabase
    .from('models')
    .select('id, alias, full_name');

  if (dbError) {
    console.error('Error al consultar los modelos:', dbError.message);
    return;
  }
  console.log(`✅ Encontrados ${models.length} modelos en la base de datos.`);

  // 2. Crear un mapa para buscar IDs por nombre normalizado
  const modelMap = new Map();
  models.forEach(model => {
    if (model.alias) modelMap.set(normalizeName(model.alias), model.id);
    if (model.full_name) modelMap.set(normalizeName(model.full_name), model.id);
  });

  // 3. Leer la carpeta de imágenes local
  let files;
  try {
    files = await readdir(LOCAL_COMPRESSED_PATH);
  } catch (err) {
    console.error(`Error: No se pudo leer la carpeta en ${path.resolve(LOCAL_COMPRESSED_PATH)}`);
    return;
  }

  // Ahora solo buscamos archivos .webp
  const imageFiles = files.filter((f) => /\.webp$/i.test(f));
  console.log(`📂 Encontradas ${imageFiles.length} imágenes .webp en la carpeta local.`);

  let successCount = 0;
  let failedFiles = [];

  // 4. Iterar y subir cada imagen
  for (const file of imageFiles) {
    const fileBaseName = path.parse(file).name;
    const normalizedFile = normalizeName(fileBaseName);
    const modelId = modelMap.get(normalizedFile);

    if (modelId) {
      // --- LÓGICA PARA ELIMINAR ANTES DE SUBIR ---
      const portfolioFolder = `${modelId}/${STORAGE_FOLDER}/`;
      const { data: existingFiles, error: listError } = await supabase.storage
        .from(BUCKET_NAME)
        .list(portfolioFolder);
      
      if (listError && listError.message !== 'The resource was not found') {
        console.warn(`⚠️  Advertencia: No se pudo verificar archivos existentes para ${file}. Se intentará subir de todas formas.`);
      } else if (existingFiles && existingFiles.length > 0) {
        const filesToDelete = existingFiles
            .filter(f => path.parse(f.name).name === STORAGE_FILE_NAME)
            .map(f => `${portfolioFolder}${f.name}`);
        
        if (filesToDelete.length > 0) {
            console.log(`🗑️  Eliminando ${filesToDelete.length} archivo(s) antiguo(s) para ${file}...`);
            const { error: removeError } = await supabase.storage
              .from(BUCKET_NAME)
              .remove(filesToDelete);

            if (removeError) {
              console.error(`❌ Error al eliminar el archivo antiguo para ${file}:`, removeError.message);
              failedFiles.push({ file, reason: 'Error al eliminar archivo antiguo' });
              continue; // Saltar al siguiente archivo
            }
        }
      }
      // --- FIN DE LA LÓGICA DE ELIMINACIÓN ---

      // Proceder con la subida
      const localFilePath = path.join(LOCAL_COMPRESSED_PATH, file);
      const storagePath = `${portfolioFolder}${STORAGE_FILE_NAME}.webp`; // Siempre subimos como .webp

      try {
        const fileBuffer = await readFile(localFilePath);
        const { error: uploadError } = await supabase.storage
          .from(BUCKET_NAME)
          .upload(storagePath, fileBuffer, {
            contentType: 'image/webp',
            upsert: true, // Upsert como medida de seguridad
          });

        if (uploadError) {
          console.error(`❌ Error subiendo ${file}:`, uploadError.message);
          failedFiles.push({ file, reason: `Error de subida: ${uploadError.message}` });
        } else {
          console.log(`✅ ÉXITO: '${file}' reemplazado y subido a -> ${storagePath}`);
          // Update DB cover path for this model (portfolio_path)
          const { error: dbUpdateError } = await supabase.from('models').update({ portfolio_path: storagePath }).eq('id', modelId);
          if (dbUpdateError) {
            console.warn(`Warning: uploaded but failed to update DB for ${modelId}:`, dbUpdateError.message);
          }
          successCount++;
        }
      } catch (err) {
        console.error(`❌ Error leyendo ${file} del disco:`, err.message);
        failedFiles.push({ file, reason: 'Error de lectura local' });
      }
    } else {
      console.warn(`⚠️ OMITIDO: No se encontró un modelo para "${file}" (buscado como: "${normalizedFile}")`);
      failedFiles.push({ file, reason: 'No se encontró el modelo en la DB' });
    }
  }

  // 5. Reporte final
  console.log('\n--- 🏁 REPORTE FINAL ---');
  console.log(`Subidas con éxito: ${successCount}`);
  console.log(`Fallidas u omitidas: ${failedFiles.length}`);

  if (failedFiles.length > 0) {
    console.warn('\nArchivos no cargados:');
    failedFiles.forEach(failed => {
      console.warn(`  - ${failed.file} (Razón: ${failed.reason})`);
    });
  }
}

runUpload();

