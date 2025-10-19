// scripts\bulkUploadCovers.mjs

// --- ¡CAMBIO REALIZADO! ---
// Importamos 'dotenv' de forma diferente
import dotenv from 'dotenv';
import path from 'path';
// Le decimos explícitamente que cargue el archivo .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
// --- FIN DEL CAMBIO ---

import { createClient } from '@supabase/supabase-js';
import { readdir, readFile } from 'fs/promises';
// 'path' ya fue importado arriba

// --- CONFIGURACIÓN ---
const LOCAL_IMAGES_PATH = 'C:\\Users\\Evo-minidesk\\Downloads\\ProcesadorDeFotos\\FOTOS_OUTPUT';
const BUCKET_NAME = 'Book_Completo_iZ_Management';
const STORAGE_PATH_PREFIX = 'Portada/cover.jpg';
// --- FIN DE CONFIGURACIÓN ---

// Carga las variables de entorno
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_KEY; 

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error(
    'Error: Faltan las variables SUPABASE_URL o SUPABASE_KEY en tu .env.local'
  );
  // Añadimos más contexto al error
  console.log('--- Variables Encontradas ---');
  console.log('SUPABASE_URL:', SUPABASE_URL ? 'Encontrada' : 'NO ENCONTRADA');
  console.log('SUPABASE_KEY:', SUPABASE_SERVICE_KEY ? 'Encontrada' : 'NO ENCONTRADA');
  console.log('-----------------------------');
  console.log('Asegúrate de que .env.local esté en el directorio C:\\Users\\Evo-minidesk\\Desktop\\nyxa');
  process.exit(1);
}

// Inicializa el cliente de Supabase con la llave de servicio
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

/**
 * Normaliza un nombre para comparación:
 * 1. Quita acentos (diacríticos).
 * 2. Convierte a minúsculas.
 * 3. Quita espacios al inicio y al final.
 */
function normalizeName(name) {
  if (!name) return '';
  return name
    .toLowerCase()
    .normalize('NFD') // Separa acentos de letras
    .replace(/[\u0300-\u036f]/g, '') // Elimina los acentos
    .trim();
}

/**
 * Función principal del script
 */
async function runUpload() {
  console.log('🚀 Iniciando script de subida masiva (con actualización de género)...');

  // 1. Obtener todos los modelos de la base de datos
  const { data: models, error: dbError } = await supabase
    .from('models')
    .select('id, alias, full_name');

  if (dbError) {
    console.error('Error al consultar los modelos:', dbError.message);
    return;
  }

  console.log(`✅ Encontrados ${models.length} modelos en la base de datos.`);

  // 2. Crear un "mapa" para búsqueda rápida
  const modelMap = new Map();
  for (const model of models) {
    if (model.alias) {
      modelMap.set(normalizeName(model.alias), model.id);
    }
    if (model.full_name) {
      modelMap.set(normalizeName(model.full_name), model.id);
    }
  }

  // 3. Leer la carpeta de imágenes local
  let files;
  try {
    files = await readdir(LOCAL_IMAGES_PATH);
  } catch (err) {
    console.error(
      `Error: No se pudo leer la carpeta en ${path.resolve(
        LOCAL_IMAGES_PATH
      )}`
    );
    return;
  }

  const imageFiles = files.filter((f) =>
    /\.(jpg|jpeg|png|webp)$/i.test(f)
  );
  console.log(`📂 Encontradas ${imageFiles.length} imágenes en la carpeta local.`);

  let successCount = 0;
  const failedFiles = [];

  // 4. Procesar y subir cada imagen
  for (const file of imageFiles) {
    const fileBaseName = path.parse(file).name; // Ej: "Badi Ceron"
    const normalizedFile = normalizeName(fileBaseName); // Ej: "badi ceron"

    // Buscar el ID del modelo en nuestro mapa
    const modelId = modelMap.get(normalizedFile);

    if (modelId) {
      // --- ¡COINCIDENCIA! ---
      const localFilePath = path.join(LOCAL_IMAGES_PATH, file);
      const storagePath = `${modelId}/${STORAGE_PATH_PREFIX}`;
      
      try {
        const fileBuffer = await readFile(localFilePath);
        const extension = path.parse(file).ext.slice(1);
        const contentType = `image/${extension === 'jpg' ? 'jpeg' : extension}`;

        // --- PASO 1: Subir la imagen ---
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
          successCount++; // Contar subida exitosa
          
          // --- PASO 2: Actualizar el género ---
          const { error: updateError } = await supabase
            .from('models')
            .update({ gender: 'Male' })
            .eq('id', modelId);

          if (updateError) {
            // La subida funcionó, pero el género falló
            console.warn(`✅ ÉXITO (Subida): ${file} -> ${storagePath}`);
            console.error(`   ❌ ERROR (Género): No se pudo actualizar el género para ${modelId}:`, updateError.message);
          } else {
            // ¡Ambos funcionaron!
            console.log(`✅ ÉXITO: ${file} -> ${storagePath} (y actualizado a 'Male')`);
          }
        }
      } catch (err) {
        console.error(`❌ Error leyendo ${file} del disco:`, err.message);
        failedFiles.push({ file, reason: 'Error de lectura local' });
      }
    } else {
      // --- SIN COINCIDENCIA ---
      console.warn(
        `⚠️ OMITIDO: No se encontró un modelo para "${file}" (buscado como: "${normalizedFile}")`
      );
      failedFiles.push({ file, reason: 'No se encontró el modelo en la DB' });
    }
  }

  // 5. Reporte final
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

// Ejecutar el script
runUpload();