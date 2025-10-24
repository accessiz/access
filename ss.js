// buscarUsersInstagram.js
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// --- CONFIGURACIÓN DE ENTORNO ---
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '.env.local') });

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('[ERROR] Faltan variables SUPABASE_URL o SUPABASE_KEY en el archivo .env.local');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// --- LISTA DE NOMBRES A BUSCAR ---
const nombres = [
  'Alejandra escobar',
  'Andrea arroyo',
  'Anika Droege',
  'Bianka molina',
  'Carolina Rodriguez',
  'Daniel morales',
  'Daniela Luarca',
  'Daniela navarro',
  'Daniella Tellez',
  'Danny Lemus',
  'Emmanuel Castillo',
  'Diana hernandez',
  'Eduardo aldana',
  'Henry Martinez',
  'Fernando barillas',
  'Isabella cordon',
  'José Jiménez',
  'Mily Pineda',
  'Mishell Diaz-Duran',
  'Nicole Hernandez',
  'Paula santizo',
  'Raquel Melgar',
  'Samara García',
  'Sofia Lima',
  'tabata dahinten',
  'yolany Villafranca',
  'Jose Brol'
];

// --- FUNCIÓN AUXILIAR ---
function normalize(str) {
  return str
    .toLowerCase()
    .normalize("NFD") // elimina acentos
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

// --- FUNCIÓN PRINCIPAL ---
async function buscarInstagramUsers() {
  console.log('[INFO] Buscando usuarios de Instagram (columna alias)...');

  const encontrados = [];
  const noEncontrados = [];

  for (const nombre of nombres) {
    const { data, error } = await supabase
      .from('models')
      .select('alias, instagram')
      .ilike('alias', `%${nombre}%`)
      .limit(1);

    if (error) {
      console.error(`[ERROR] Al buscar "${nombre}": ${error.message}`);
      continue;
    }

    if (data && data.length > 0 && data[0].instagram) {
      let user = data[0].instagram.trim();
      if (!user.startsWith('@')) user = '@' + user;
      encontrados.push({ nombre, instagram: user });
    } else {
      noEncontrados.push(nombre);
    }
  }

  // --- MOSTRAR RESULTADOS ---
  console.log('\n✅ Usuarios encontrados:');
  const usersSolo = encontrados.map(e => e.instagram);
  for (let i = 0; i < usersSolo.length; i += 4) {
    console.log(usersSolo.slice(i, i + 4).join(' '));
  }

  console.log('\n❌ No encontrados:');
  if (noEncontrados.length === 0) {
    console.log('Todos los nombres fueron encontrados.');
  } else {
    console.log(noEncontrados.join(', '));
  }

  console.log(`\nResumen: ${encontrados.length} encontrados / ${noEncontrados.length} no encontrados`);
}

// Ejecutar
buscarInstagramUsers();
