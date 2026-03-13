-- Transactional cascade delete for projects.
-- Deletes all dependent rows in a single atomic transaction,
-- preventing inconsistent state if any step fails.
--
-- Called from the app via: supabase.rpc('delete_project_cascade', { p_project_id, p_user_id })

CREATE OR REPLACE FUNCTION delete_project_cascade(
  p_project_id UUID,
  p_user_id   UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_owner_id UUID;
  v_schedule_ids UUID[];
BEGIN
  -- 1. Verify ownership (prevents unauthorized deletes)
  SELECT user_id INTO v_owner_id
    FROM projects
   WHERE id = p_project_id;

  IF v_owner_id IS NULL THEN
    RAISE EXCEPTION 'Project not found: %', p_project_id;
  END IF;

  IF v_owner_id <> p_user_id THEN
    RAISE EXCEPTION 'Unauthorized: user % does not own project %', p_user_id, p_project_id;
  END IF;

  -- 2. Collect schedule IDs for this project
  SELECT COALESCE(array_agg(id), '{}')
    INTO v_schedule_ids
    FROM project_schedule
   WHERE project_id = p_project_id;

  -- 3. Delete model_assignments by project_id (direct FK)
  DELETE FROM model_assignments WHERE project_id = p_project_id;

  -- 4. Delete model_assignments by schedule_id (indirect FK)
  IF array_length(v_schedule_ids, 1) > 0 THEN
    DELETE FROM model_assignments WHERE schedule_id = ANY(v_schedule_ids);
  END IF;

  -- 5. Delete project_schedule
  DELETE FROM project_schedule WHERE project_id = p_project_id;

  -- 6. Delete projects_models (junction table)
  DELETE FROM projects_models WHERE project_id = p_project_id;

  -- 7. Delete the project itself
  DELETE FROM projects WHERE id = p_project_id;
END;
$$;
