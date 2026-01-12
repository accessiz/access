-- ==============================================================================
-- AUTO-CLOSE EXPIRED PROJECTS (pg_cron)
-- ==============================================================================
-- Este SQL crea una función y un cron job que se ejecuta diariamente a las
-- 00:01 hora de Guatemala (GMT-6) para cerrar proyectos expirados.
--
-- INSTRUCCIONES:
-- 1. Ejecuta este SQL en tu Supabase SQL Editor
-- 2. Verifica que la extensión pg_cron esté habilitada
-- ==============================================================================

-- 1. Habilitar pg_cron si no está habilitado
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 2. Crear la función de auto-cierre
CREATE OR REPLACE FUNCTION public.auto_close_expired_projects()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    project_record RECORD;
    last_schedule_date DATE;
    today_guatemala DATE;
BEGIN
    -- Obtener la fecha actual en Guatemala (GMT-6)
    today_guatemala := (NOW() AT TIME ZONE 'America/Guatemala')::DATE;
    
    -- Buscar proyectos que cumplan las condiciones:
    -- 1. No están completed ni archived
    -- 2. Tienen schedule con fechas
    FOR project_record IN
        SELECT 
            p.id,
            p.project_name,
            p.schedule
        FROM projects p
        WHERE p.status NOT IN ('completed', 'archived')
          AND p.schedule IS NOT NULL
          AND jsonb_array_length(p.schedule) > 0
    LOOP
        -- Obtener la última fecha del schedule
        SELECT MAX((elem->>'date')::DATE)
        INTO last_schedule_date
        FROM jsonb_array_elements(project_record.schedule) AS elem;
        
        -- Si la última fecha ya pasó, cerrar el proyecto
        IF last_schedule_date < today_guatemala THEN
            -- Marcar modelos pendientes como rechazados
            UPDATE projects_models
            SET client_selection = 'rejected'
            WHERE project_id = project_record.id
              AND client_selection = 'pending';
            
            -- Cambiar estado del proyecto a completed
            UPDATE projects
            SET status = 'completed'
            WHERE id = project_record.id;
            
            RAISE NOTICE 'Proyecto cerrado automáticamente: % (ID: %)', 
                         project_record.project_name, project_record.id;
        END IF;
    END LOOP;
END;
$$;

-- 3. Crear el cron job (ejecutar a las 00:01 Guatemala = 06:01 UTC)
-- Guatemala es GMT-6, así que 00:01 Guatemala = 06:01 UTC
SELECT cron.schedule(
    'auto-close-expired-projects',  -- nombre del job
    '1 6 * * *',                     -- cron: minuto 1, hora 6 UTC = 00:01 Guatemala
    'SELECT public.auto_close_expired_projects()'
);

-- ==============================================================================
-- VERIFICACIÓN
-- ==============================================================================
-- Para verificar que el cron job está configurado:
-- SELECT * FROM cron.job;
--
-- Para ejecutar manualmente (para testing):
-- SELECT public.auto_close_expired_projects();
--
-- Para ver los logs de ejecución:
-- SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 10;
-- ==============================================================================
