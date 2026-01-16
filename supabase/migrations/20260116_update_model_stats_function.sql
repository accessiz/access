-- Update function to include last project date for models with few applications
-- This helps identify models that haven't been applied for in a long time

-- Drop existing function first (return type changed)
DROP FUNCTION IF EXISTS get_model_application_stats();

CREATE OR REPLACE FUNCTION get_model_application_stats()
RETURNS TABLE (
  model_id uuid,
  alias text,
  cover_path text,
  total_count bigint,
  approved_count bigint,
  rejected_count bigint,
  last_project_date date
)
LANGUAGE sql
STABLE
AS $$
  SELECT 
    pm.model_id,
    m.alias,
    m.cover_path,
    COUNT(*) as total_count,
    COUNT(*) FILTER (WHERE pm.client_selection = 'approved') as approved_count,
    COUNT(*) FILTER (WHERE pm.client_selection = 'rejected') as rejected_count,
    MAX(p.created_at::date) as last_project_date
  FROM projects_models pm
  JOIN models m ON m.id = pm.model_id
  JOIN projects p ON p.id = pm.project_id
  GROUP BY pm.model_id, m.alias, m.cover_path
$$;

-- Create a new function to get all models (including those with 0 applications)
CREATE OR REPLACE FUNCTION get_all_models_application_stats()
RETURNS TABLE (
  model_id uuid,
  alias text,
  cover_path text,
  total_count bigint,
  approved_count bigint,
  rejected_count bigint,
  last_project_date date
)
LANGUAGE sql
STABLE
AS $$
  SELECT 
    m.id as model_id,
    m.alias,
    m.cover_path,
    COALESCE(stats.total_count, 0) as total_count,
    COALESCE(stats.approved_count, 0) as approved_count,
    COALESCE(stats.rejected_count, 0) as rejected_count,
    stats.last_project_date
  FROM models m
  LEFT JOIN (
    SELECT 
      pm.model_id,
      COUNT(*) as total_count,
      COUNT(*) FILTER (WHERE pm.client_selection = 'approved') as approved_count,
      COUNT(*) FILTER (WHERE pm.client_selection = 'rejected') as rejected_count,
      MAX(p.created_at::date) as last_project_date
    FROM projects_models pm
    JOIN projects p ON p.id = pm.project_id
    GROUP BY pm.model_id
  ) stats ON stats.model_id = m.id
  WHERE m.is_public = true OR m.is_public IS NULL
  ORDER BY COALESCE(stats.total_count, 0) ASC, COALESCE(stats.last_project_date, '1900-01-01'::date) ASC
$$;
