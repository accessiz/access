// migrate.js
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const { S3Client } = require('@aws-sdk/client-s3');
const { Upload } = require('@aws-sdk/lib-storage');

// --- CONFIGURACIÓN ---
const SOURCE_BUCKET = 'Book_Completo_iZ_Management'; 
const DEST_BUCKET = process.env.R2_BUCKET_NAME || 'iz-access-media'; 

const serviceKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!serviceKey) {
  console.error('❌ ERROR: Falta la SUPABASE_SERVICE_KEY (service_role) en tu .env.local');
  process.exit(1);
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  serviceKey
);

const r2 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

async function migrate() {
  console.log(`🚀 Iniciando migración MASIVA...`);
  console.log(`Origen: [${SOURCE_BUCKET}] -> Destino: [${DEST_BUCKET}]`);
  console.log('📂 Escaneando todas las carpetas (esto tomará un momento)...');

  const fileQueue = [];

  // Función recursiva MEJORADA con PAGINACIÓN
  async function exploreFolder(path) {
    let offset = 0;
    let keepFetching = true;
    const LIMIT = 100; // Máximo permitido por Supabase por petición

    while (keepFetching) {
      // Pedimos bloques de 100 en 100
      const { data, error } = await supabase.storage
        .from(SOURCE_BUCKET)
        .list(path, { 
          limit: LIMIT, 
          offset: offset,
          sortBy: { column: 'name', order: 'asc' }
        });
      
      if (error) {
        console.error(`Error leyendo ruta "${path}":`, error.message);
        return;
      }

      // Si no devuelve nada, terminamos este nivel
      if (!data || data.length === 0) {
        keepFetching = false;
        break;
      }

      for (const item of data) {
        if (item.name === '.emptyFolderPlaceholder') continue;

        const fullPath = path ? `${path}/${item.name}` : item.name;

        if (!item.id) {
          // Es Carpeta -> Entramos (Recursión)
          // Imprimimos para que veas que avanza
          process.stdout.write(`\r🔍 Explorando (${fileQueue.length} archivos encontrados)... Último: ${item.name.substring(0, 20)}`); 
          await exploreFolder(fullPath);
        } else {
          // Es Archivo -> A la cola
          fileQueue.push(fullPath);
        }
      }

      // Si recibimos menos del límite, significa que era la última página
      if (data.length < LIMIT) {
        keepFetching = false;
      } else {
        // Si recibimos 100 exactos, puede que haya más. Avanzamos el offset.
        offset += LIMIT;
      }
    }
  }

  // Arrancamos el escaneo
  await exploreFolder('');
  
  console.log(`\n\n✅ ESCANEO COMPLETO.`);
  console.log(`📊 Se encontraron ${fileQueue.length} archivos en total.`);
  console.log('---------------------------------------------------');

  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < fileQueue.length; i++) {
    const filePath = fileQueue[i];
    const progress = Math.round(((i + 1) / fileQueue.length) * 100);

    try {
      // A. Descargar
      const { data: fileBlob, error: downloadError } = await supabase
        .storage
        .from(SOURCE_BUCKET)
        .download(filePath);

      if (downloadError) throw downloadError;

      const arrayBuffer = await fileBlob.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // B. Subir
      const upload = new Upload({
        client: r2,
        params: {
          Bucket: DEST_BUCKET,
          Key: filePath, 
          Body: buffer,
          ContentType: fileBlob.type || 'application/octet-stream',
        },
      });

      await upload.done();
      
      // Log simplificado para que no llene tanto la pantalla
      process.stdout.write(`\r[${progress}%] ✅ Migrando: ${filePath.substring(0, 50)}... `);
      successCount++;

    } catch (err) {
      console.error(`\n❌ FALLÓ: ${filePath} - ${err.message}`);
      errorCount++;
    }
  }

  console.log('\n\n---------------------------------------------------');
  console.log('🏁 MIGRACIÓN TERMINADA');
  console.log(`📦 Total archivos procesados: ${fileQueue.length}`);
  console.log(`✅ Subidos correctamente: ${successCount}`);
  console.log(`❌ Errores: ${errorCount}`);
}

migrate();