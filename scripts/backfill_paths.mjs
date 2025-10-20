import dotenv from 'dotenv';
import path from 'path';
import pLimit from 'p-limit';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_KEY;
const BUCKET_NAME = 'Book_Completo_iZ_Management';

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_KEY in env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function getAllModelIds() {
  const { data, error } = await supabase.from('models').select('id');
  if (error) throw error;
  return data.map(d => d.id);
}

async function processModel(id) {
  try {
    // Portada
    const { data: coverList } = await supabase.storage.from(BUCKET_NAME).list(`${id}/Portada/`, { limit: 1 });
    const cover_path = (coverList && coverList.length > 0) ? `${id}/Portada/${coverList[0].name}` : null;

    // Portfolio
    const { data: portfolioList } = await supabase.storage.from(BUCKET_NAME).list(`${id}/Portfolio/`, { limit: 1 });
    const portfolio_path = (portfolioList && portfolioList.length > 0) ? `${id}/Portfolio/${portfolioList[0].name}` : null;

    // Contraportadas
    const { data: files } = await supabase.storage.from(BUCKET_NAME).list(`${id}/Contraportada/`, { sortBy: { column: 'name', order: 'asc' } });
    const comp_card_paths = Array(4).fill(null);
    if (files && files.length > 0) {
      for (const f of files) {
        const m = f.name.match(/comp_(\d+)/);
        if (m && m[1]) {
          const idx = parseInt(m[1], 10);
          if (idx >= 0 && idx < 4) comp_card_paths[idx] = `${id}/Contraportada/${f.name}`;
        }
      }
    }

    // Update DB
    const { error } = await supabase.from('models').update({ cover_path, portfolio_path, comp_card_paths }).eq('id', id);
    if (error) {
      console.error(`Error updating model ${id}:`, error.message || error);
      return { id, ok: false };
    }
    return { id, ok: true };
  } catch (err) {
    console.error(`Error processing model ${id}:`, err);
    return { id, ok: false };
  }
}

async function run() {
  const ids = await getAllModelIds();
  console.log(`Found ${ids.length} models. Starting backfill with concurrency 5...`);
  const limit = pLimit(5);
  const results = await Promise.all(ids.map(id => limit(() => processModel(id))));
  const failed = results.filter(r => !r.ok);
  console.log(`Backfill finished. Success: ${results.length - failed.length}, Failed: ${failed.length}`);
}

run().catch(e => { console.error(e); process.exit(1); });
