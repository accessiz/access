// download-all-storage.js
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs').promises;
const path = require('path');

// --- CONFIGURACIÓN ---
// 1. Escribe el nombre del bucket de Supabase que quieres descargar.
const BUCKET_NAME = 'Book_Completo_iZ_Management';

// 2. Define la carpeta local donde se guardará todo (se creará si no existe).
const BASE_DOWNLOAD_FOLDER = path.resolve(__dirname, 'supabase_backup');
// --- FIN DE LA CONFIGURACIÓN ---

// --- Conexión a Supabase ---
const serviceKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!serviceKey) {
  console.error('❌ ERROR: Falta la SUPABASE_SERVICE_KEY (service_role) en tu .env.local');
  process.exit(1);
}
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  serviceKey
);
// -------------------------


/**
 * Función principal que orquesta la descarga masiva.
 */
async function downloadBucket() {
  console.log(`🚀 Iniciando descarga MASIVA del bucket: [${BUCKET_NAME}]`);
  console.log(`📂 Destino local: "${BASE_DOWNLOAD_FOLDER}"`);
  console.log('🕵️‍♂️ Escaneando todos los archivos (esto puede tardar un momento)...');

  const fileQueue = [];

  // Función recursiva para explorar todas las carpetas, con paginación para no fallar.
  async function exploreFolder(currentPath) {
    let offset = 0;
    const LIMIT = 100; // Máximo de archivos por petición a Supabase
    let keepFetching = true;

    while (keepFetching) {
      const { data, error } = await supabase.storage
        .from(BUCKET_NAME)
        .list(currentPath, { limit: LIMIT, offset });

      if (error) {
        console.error(`❌ Error leyendo la ruta "${currentPath}":`, error.message);
        return; // Salir de esta rama si hay un error
      }

      if (!data || data.length === 0) {
        keepFetching = false;
        break;
      }

      for (const item of data) {
        const fullPath = currentPath ? `${currentPath}/${item.name}` : item.name;

        if (item.id) { // Es un archivo (tiene ID)
          fileQueue.push(fullPath);
        } else { // Es una carpeta (no tiene ID)
          process.stdout.write(`\r🔍 Explorando... (${fileQueue.length} archivos encontrados)`);
          await exploreFolder(fullPath);
        }
      }

      if (data.length < LIMIT) {
        keepFetching = false;
      } else {
        offset += LIMIT;
      }
    }
  }

  // Iniciar el escaneo desde la raíz del bucket
  await exploreFolder('');

  console.log(`\n\n✅ ESCANEO COMPLETO.`);
  console.log(`📊 Se encontraron ${fileQueue.length} archivos en total.`);
  console.log('---------------------------------------------------\n');

  let successCount = 0;
  let errorCount = 0;
  let skippedCount = 0;

  // Crear la carpeta base si no existe
  await fs.mkdir(BASE_DOWNLOAD_FOLDER, { recursive: true });

  for (let i = 0; i < fileQueue.length; i++) {
    const filePath = fileQueue[i];
    const localPath = path.join(BASE_DOWNLOAD_FOLDER, filePath);
    const progress = Math.round(((i + 1) / fileQueue.length) * 100);

    process.stdout.write(`\r[${progress}%] 📥 Descargando: ${filePath.substring(0, 70)}... `);

    try {
        // Verificar si el archivo ya existe
        await fs.access(localPath);
        // Si no lanza error, el archivo existe. Lo saltamos.
        // process.stdout.write(`\r[${progress}%] ⏩ Saltando (ya existe): ${filePath.substring(0, 50)}... `);
        skippedCount++;
        continue; // Pasar al siguiente archivo
    } catch (e) {
        // Si fs.access lanza error, es porque el archivo NO existe. Procedemos a descargar.
    }


    try {
      // 1. Asegurar que el directorio local exista
      await fs.mkdir(path.dirname(localPath), { recursive: true });

      // 2. Descargar el archivo desde Supabase
      const { data, error: downloadError } = await supabase.storage
        .from(BUCKET_NAME)
        .download(filePath);

      if (downloadError) throw downloadError;

      // 3. Escribir el archivo en el disco local
      const buffer = Buffer.from(await data.arrayBuffer());
      await fs.writeFile(localPath, buffer);
      
      successCount++;

    } catch (err) {
      process.stdout.write(`\n❌ FALLÓ: ${filePath} - ${err.message}\n`);
      errorCount++;
    }
  }

  console.log('\n\n---------------------------------------------------');
  console.log('🏁 DESCARGA COMPLETADA');
  console.log(`🗂️  Total archivos en el bucket: ${fileQueue.length}`);
  console.log(`✅ Descargados exitosamente: ${successCount}`);
  console.log(`⏩ Saltados (ya existían): ${skippedCount}`);
  console.log(`❌ Errores: ${errorCount}`);
}

// Ejecutar el script
downloadBucket();
