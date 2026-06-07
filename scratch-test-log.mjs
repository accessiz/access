import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wsxheefrjomkmhykyoxv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndzeGhlZWZyam9ta21oeWt5b3h2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjY0MjA3MiwiZXhwIjoyMDg4MjE4MDcyfQ.XNu_yOZ2ithuasSWQvyRIqmiNdSQ0cHd2H0KBDXSWQg';

const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

async function testLog() {
  const projectId = '5c6f76a7-717e-492c-b1fe-a5aa241702f2';
  const modelId = 'df2de61d-a087-449f-b91b-a0290779d4b7'; // Aaron Santiago Medina Varela

  try {
    console.log("1. Checking projects_models relation...");
    const { data: relation, error: relError } = await supabaseAdmin
      .from('projects_models')
      .select('last_opened_at')
      .eq('project_id', projectId)
      .eq('model_id', modelId)
      .maybeSingle();

    console.log("Relation:", relation, "Error:", relError);

    console.log("2. Updating last_opened_at in projects_models...");
    const { data: updateRes, error: updateError } = await supabaseAdmin
      .from('projects_models')
      .update({ last_opened_at: new Date().toISOString() })
      .eq('project_id', projectId)
      .eq('model_id', modelId)
      .select();
    
    console.log("Update Result:", updateRes, "Update Error:", updateError);

    console.log("3. Fetching project and model info...");
    const [{ data: project, error: pError }, { data: model, error: mError }] = await Promise.all([
      supabaseAdmin.from('projects').select('user_id, project_name').eq('id', projectId).single(),
      supabaseAdmin.from('models').select('alias, full_name').eq('id', modelId).single(),
    ]);

    console.log("Project:", project, "Error:", pError);
    console.log("Model:", model, "Error:", mError);

    if (!project || !model) {
      console.log("❌ Project or Model not found!");
      return;
    }

    console.log("4. Checking existing log in activity_logs...");
    const { data: existingLog, error: logErr } = await supabaseAdmin
      .from('activity_logs')
      .select('id')
      .eq('user_id', project.user_id)
      .eq('metadata->>project_id', projectId)
      .eq('metadata->>entity_id', modelId)
      .eq('metadata->>action', 'opened_link')
      .maybeSingle();

    console.log("Existing log:", existingLog, "Error:", logErr);

    console.log("5. Inserting new log into activity_logs...");
    const { data: insertRes, error: insertError } = await supabaseAdmin
      .from('activity_logs')
      .insert({
        user_id: project.user_id,
        category: 'talent',
        title: `${model.alias || model.full_name} abrió el enlace del proyecto "${project.project_name}"`,
        message: `${model.alias || model.full_name} visualizó la propuesta de trabajo.`,
        metadata: {
          entity_id: modelId,
          entity_type: 'model',
          project_id: projectId,
          action: 'opened_link',
          model_alias: model.alias || model.full_name,
        },
      })
      .select();

    console.log("Insert Result:", insertRes, "Insert Error:", insertError);
  } catch (err) {
    console.error("Caught error:", err);
  }
}

testLog();
