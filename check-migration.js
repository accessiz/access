// check-migration.js
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const { S3Client, ListObjectsV2Command } = require('@aws-sdk/client-s3');

// --- CONFIGURACIÓN ---
const SUPABASE_BUCKET = 'Book_Completo_iZ_Management';
const R2_BUCKET = process.env.R2_BUCKET_NAME || 'iz-access-media';

// --- CLIENTES ---
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
);

const r2 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

async function audit() {
  console.log('🕵️‍♂️  INICIANDO AUDITORÍA DE CARPETAS...\n');

  // 1. Obtener carpetas de Supabase (Root folders)
  console.log(`📡 Obteniendo lista maestra desde Supabase [${SUPABASE_BUCKET}]...`);
  const supabaseFolders = new Set();
  let sbOffset = 0;
  let keepFetchingSb = true;

  while (keepFetchingSb) {
    const { data, error } = await supabase.storage
      .from(SUPABASE_BUCKET)
      .list('', { limit: 100, offset: sbOffset }); // Listar raíz

    if (error) {
      console.error('❌ Error Supabase:', error);
      break;
    }
    
    if (!data || data.length === 0) {
      keepFetchingSb = false;
    } else {
      data.forEach(item => {
        // Asumimos que los nombres en la raíz sin extensión son carpetas de modelos
        if (!item.name.includes('.')) { 
            supabaseFolders.add(item.name);
        }
      });
      
      if (data.length < 100) keepFetchingSb = false;
      else sbOffset += 100;
    }
  }
  console.log(`   ✅ Supabase tiene ${supabaseFolders.size} modelos (carpetas).`);


  // 2. Obtener carpetas de R2 (CommonPrefixes)
  console.log(`☁️  Obteniendo lista desde R2 [${R2_BUCKET}]...`);
  const r2Folders = new Set();
  let continuationToken = undefined;

  do {
    const command = new ListObjectsV2Command({
      Bucket: R2_BUCKET,
      Delimiter: '/', // Esto le dice a R2 que agrupe por carpetas raíz
      ContinuationToken: continuationToken
    });

    try {
      const response = await r2.send(command);
      
      // En S3/R2, las carpetas salen en 'CommonPrefixes'
      if (response.CommonPrefixes) {
        response.CommonPrefixes.forEach(prefix => {
          // El prefix viene como "uuid/", quitamos la barra final
          const folderName = prefix.Prefix.replace('/', '');
          r2Folders.add(folderName);
        });
      }

      continuationToken = response.NextContinuationToken;
    } catch (err) {
      console.error("❌ Error R2:", err);
      break;
    }
  } while (continuationToken);

  console.log(`   ✅ R2 tiene ${r2Folders.size} modelos (carpetas).`);

  // 3. COMPARACIÓN
  console.log('\n----------------RESULTADOS----------------');
  
  const missingInR2 = [];
  
  supabaseFolders.forEach(folder => {
    if (!r2Folders.has(folder)) {
      missingInR2.push(folder);
    }
  });

  if (missingInR2.length === 0) {
    console.log('🎉 ¡FELICIDADES! Sincronización al 100%.');
    console.log(`Todos los ${supabaseFolders.size} modelos tienen carpeta en R2.`);
  } else {
    console.log(`⚠️  ATENCIÓN: Faltan ${missingInR2.length} modelos en R2.`);
    console.log('\n📋 LISTA DE FALTANTES (Copiar y guardar):');
    missingInR2.forEach(id => console.log(`❌ ${id}`));
    
    console.log('\n💡 SUGERENCIA:');
    console.log('Ejecuta el script de migración nuevamente. Como ya tienes la mayoría,');
    console.log('el script pasará rápido por los existentes y subirá estos faltantes.');
  }
}

audit();
