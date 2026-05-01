import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wsxheefrjomkmhykyoxv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndzeGhlZWZyam9ta21oeWt5b3h2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjY0MjA3MiwiZXhwIjoyMDg4MjE4MDcyfQ.XNu_yOZ2ithuasSWQvyRIqmiNdSQ0cHd2H0KBDXSWQg';

const supabase = createClient(supabaseUrl, supabaseKey);

async function findModel() {
  const targetId = '2986997610101';
  const targetName = 'Marcelo Mendoza';

  console.log(`Searching for model: ${targetName} or ID: ${targetId}...`);
  
  const { data, error } = await supabase
    .from('models')
    .select('*')
    .or(`national_id.eq.${targetId},full_name.ilike.%${targetName}%,alias.ilike.%${targetName}%`);

  if (error) {
    console.error('Error searching data:', error);
    process.exit(1);
  }

  if (data.length === 0) {
    console.log('❌ No model found with those details.');
  } else {
    console.log(`✅ Found ${data.length} match(es):`);
    console.log(JSON.stringify(data, null, 2));
  }
}

findModel();
