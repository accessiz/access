import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log("Fetching columns of the 'projects' table...");
  const { data: rows, error: rError } = await supabaseAdmin
    .from('projects')
    .select('*')
    .limit(1);
    
  if (rError) {
    console.error("Error fetching project rows:", rError);
    return;
  }
  
  if (rows && rows.length > 0) {
    console.log("Columns from row keys:", Object.keys(rows[0]));
  } else {
    console.log("No rows in projects table. Let's try running a direct query via SQL or check schema.");
  }
}

run();
