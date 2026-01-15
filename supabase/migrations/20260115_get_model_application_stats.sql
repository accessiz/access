-- Function to get model application statistics with aggregation in SQL
-- More efficient than fetching all records and counting in JavaScript

CREATE OR REPLACE FUNCTION get_model_application_stats()
RETURNS TABLE (
  model_id uuid,
  alias text,
  cover_path text,
  total_count bigint,
  approved_count bigint,
  rejected_count bigint
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
    COUNT(*) FILTER (WHERE pm.client_selection = 'rejected') as rejected_count
  FROM projects_models pm
  JOIN models m ON m.id = pm.model_id
  GROUP BY pm.model_id, m.alias, m.cover_path
$$;
