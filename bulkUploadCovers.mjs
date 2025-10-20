// scripts\bulkUploadCovers.mjs

import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import { createClient } from '@supabase/supabase-js';
import { readdir, readFile } from 'fs/promises';

// --- CONFIGURACIÓN ---
const LOCAL_IMAGES_PATH = 'C:\\Users\\Evo-minidesk\\Downloads\\ProcesadorDeFotos\\FOTOS_OUTPUT';
const BUCKET_NAME = 'Book_Completo_iZ_Management';

// --- ¡CORRECCIÓN! ---
// Ya no definimos el nombre del archivo, solo la carpeta.
const STORAGE_FOLDER = 'Portada';
// --- FIN DE LA CORRECCIÓN ---

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
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

async function runUpload() {
  console.log('🚀 Iniciando script de subida masiva (V2 - Arreglando .webp)...');

  const { data: models, error: dbError } = await supabase
    .from('models')
    .select('id, alias, full_name');

  if (dbError) {
    console.error('Error al consultar los modelos:', dbError.message);
    return;
  }

  console.log(`✅ Encontrados ${models.length} modelos en la base de datos.`);

  const modelMap = new Map();
  for (const model of models) {
    if (model.alias) {
      modelMap.set(normalizeName(model.alias), model.id);
    }
    if (model.full_name) {
      modelMap.set(normalizeName(model.full_name), model.id);
    }
  }

  let files;
  try {
    files = await readdir(LOCAL_IMAGES_PATH);
  } catch (err) {
    console.error(`Error: No se pudo leer la carpeta en ${path.resolve(LOCAL_IMAGES_PATH)}`);
    return;
  }

  const imageFiles = files.filter((f) =>
    /\.(jpg|jpeg|png|webp)$/i.test(f)
  );
  console.log(`📂 Encontradas ${imageFiles.length} imágenes en la carpeta local.`);

  let successCount = 0;
  const failedFiles = [];

  for (const file of imageFiles) {
    const fileBaseName = path.parse(file).name;
    const normalizedFile = normalizeName(fileBaseName);
    const modelId = modelMap.get(normalizedFile);

    if (modelId) {
      const localFilePath = path.join(LOCAL_IMAGES_PATH, file);
      
      // --- ¡CORRECCIÓN! ---
      // Obtenemos la extensión del archivo local (ej: ".webp")
      const extension = path.parse(file).ext; 
      // Creamos la ruta de destino correcta (ej: [uuid]/Portada/cover.webp)
      const storagePath = `${modelId}/${STORAGE_FOLDER}/cover${extension}`;
      // --- FIN DE LA CORRECCIÓN ---

      try {
        const fileBuffer = await readFile(localFilePath);
        
        // --- ¡CORRECCIÓN! ---
        // Obtenemos la extensión sin el punto (ej: "webp")
        const extName = extension.slice(1);
        const contentType = `image/${extName === 'jpg' ? 'jpeg' : extName}`;
        // --- FIN DE LA CORRECCIÓN ---

        const { error: uploadError } = await supabase.storage
          .from(BUCKET_NAME)
          .upload(storagePath, fileBuffer, {
            contentType,
            upsert: true, // Sobrescribe si ya existe
          });

        if (uploadError) {
          console.error(`❌ Error subiendo ${file}:`, uploadError.message);
          failedFiles.push({ file, reason: `Error de subida: ${uploadError.message}` });
        } else {
          successCount++;
          const { error: updateError } = await supabase
            .from('models')
            .update({ gender: 'Male' })
            .eq('id', modelId);

          if (updateError) {
            console.warn(`✅ ÉXITO (Subida): ${file} -> ${storagePath}`);
            console.error(`   ❌ ERROR (Género): No se pudo actualizar el género para ${modelId}:`, updateError.message);
          } else {
            console.log(`✅ ÉXITO: ${file} -> ${storagePath} (y actualizado a 'Male')`);
          }
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

  console.log('\n--- 🏁 REPORTE FINAL ---');
  console.log(`Subidas con éxito: ${successCount}`);
  console.log(`Fallidas u omitidas: ${failedFiles.length}`);

  if (failedFiles.length > 0) {
    console.warn('\nArchivos no cargados:');
    for (const failed of failedFiles) {
      console.warn(`  - ${failed.file} (Razón: ${failed.reason})`);
    }
  }
}

runUpload();