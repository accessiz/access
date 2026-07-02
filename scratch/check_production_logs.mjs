import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://wsxheefrjomkmhykyoxv.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log("Searching for project 'Flexi Guatemala'...");
  const { data: projects, error: pError } = await supabaseAdmin
    .from('projects')
    .select('id, project_name, client_name, public_id, status, end_date')
    .ilike('project_name', '%Flexi Guatemala%');

  if (pError) {
    console.error("Error fetching projects:", pError);
    return;
  }

  console.log("Projects found:", projects);

  if (!projects || projects.length === 0) {
    console.log("No projects found.");
    return;
  }

  const project = projects[0];
  const projectId = project.id;

  console.log(`\nFetching projects_models rows for project ID ${projectId}...`);
  const { data: pmData, error: pmError } = await supabaseAdmin
    .from('projects_models')
    .select('model_id, client_selection, client_selection_date')
    .eq('project_id', projectId);

  if (pmError) {
    console.error("Error fetching projects_models:", pmError);
    return;
  }

  console.log("projects_models rows:", pmData);

  console.log(`\nFetching recent activity logs for project ID ${projectId} or general...`);
  const { data: activityLogs, error: logError } = await supabaseAdmin
    .from('activity_logs')
    .select('*')
    .or(`metadata->>project_id.eq.${projectId},title.ilike.%Flexi%`)
    .order('created_at', { ascending: false })
    .limit(10);

  if (logError) {
    console.error("Error fetching activity_logs:", logError);
    return;
  }

  console.log("Activity logs:", JSON.stringify(activityLogs, null, 2));
}

run();
