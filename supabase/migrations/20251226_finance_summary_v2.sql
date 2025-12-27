-- =====================================================
-- VISTA MEJORADA DE FINANZAS v2
-- =====================================================
-- Cambios respecto a la versión anterior:
-- 1. Solo incluye modelos APROBADOS (client_selection = 'approved')
-- 2. Solo proyectos COMPLETADOS (última fecha < hoy)
-- 3. Agrupa por modelo+proyecto (no por día individual)
-- 4. Calcula días trabajados y total automáticamente
-- =====================================================

-- Primero eliminamos la vista anterior si existe
DROP VIEW IF EXISTS finance_summary;

-- Crear la nueva vista consolidada
CREATE OR REPLACE VIEW finance_summary AS
WITH project_dates AS (
    -- Obtener la última fecha de cada proyecto
    SELECT 
        project_id,
        MAX(end_time) as last_project_date
    FROM project_schedule
    GROUP BY project_id
),
model_project_days AS (
    -- Contar días trabajados por modelo por proyecto
    SELECT 
        ma.model_id,
        ps.project_id,
        COUNT(DISTINCT ps.id) as days_worked,
        MIN(ps.start_time) as first_work_date,
        MAX(ps.end_time) as last_work_date,
        -- Usar el fee del proyecto o del assignment
        COALESCE(ma.daily_fee, pm.agreed_fee, p.default_model_fee) as daily_fee,
        p.currency
    FROM model_assignments ma
    JOIN project_schedule ps ON ps.id = ma.schedule_id
    JOIN projects p ON p.id = ps.project_id
    LEFT JOIN projects_models pm ON pm.project_id = p.id AND pm.model_id = ma.model_id
    GROUP BY ma.model_id, ps.project_id, ma.daily_fee, pm.agreed_fee, p.default_model_fee, p.currency
)
SELECT 
    -- ID único compuesto (para React keys)
    md5(mpd.model_id::text || mpd.project_id::text)::uuid as id,
    mpd.model_id,
    m.full_name as model_name,
    m.alias as model_alias,
    mpd.project_id,
    p.project_name,
    p.client_name,
    c.name as registered_client_name,
    b.name as brand_name,
    mpd.days_worked,
    mpd.daily_fee,
    (mpd.days_worked * COALESCE(mpd.daily_fee, 0)) as total_amount,
    mpd.first_work_date,
    mpd.last_work_date,
    mpd.currency,
    -- Estado de pago: verificamos si TODAS las asignaciones están pagadas
    CASE 
        WHEN NOT EXISTS (
            SELECT 1 FROM model_assignments ma2 
            JOIN project_schedule ps2 ON ps2.id = ma2.schedule_id
            WHERE ma2.model_id = mpd.model_id 
            AND ps2.project_id = mpd.project_id
            AND (ma2.payment_status IS NULL OR ma2.payment_status != 'paid')
        ) THEN 'paid'
        WHEN EXISTS (
            SELECT 1 FROM model_assignments ma2 
            JOIN project_schedule ps2 ON ps2.id = ma2.schedule_id
            WHERE ma2.model_id = mpd.model_id 
            AND ps2.project_id = mpd.project_id
            AND ma2.payment_status = 'paid'
        ) THEN 'partial'
        ELSE 'pending'
    END as payment_status,
    -- Fecha del último pago
    (
        SELECT MAX(ma2.payment_date) FROM model_assignments ma2 
        JOIN project_schedule ps2 ON ps2.id = ma2.schedule_id
        WHERE ma2.model_id = mpd.model_id 
        AND ps2.project_id = mpd.project_id
        AND ma2.payment_status = 'paid'
    ) as payment_date,
    -- Total ya pagado
    COALESCE((
        SELECT SUM(pt.amount) FROM payment_transactions pt
        JOIN model_assignments ma2 ON ma2.id = pt.model_assignment_id
        JOIN project_schedule ps2 ON ps2.id = ma2.schedule_id
        WHERE ma2.model_id = mpd.model_id 
        AND ps2.project_id = mpd.project_id
    ), 0) as total_paid,
    -- Monto pendiente
    (mpd.days_worked * COALESCE(mpd.daily_fee, 0)) - COALESCE((
        SELECT SUM(pt.amount) FROM payment_transactions pt
        JOIN model_assignments ma2 ON ma2.id = pt.model_assignment_id
        JOIN project_schedule ps2 ON ps2.id = ma2.schedule_id
        WHERE ma2.model_id = mpd.model_id 
        AND ps2.project_id = mpd.project_id
    ), 0) as pending_amount,
    p.user_id
FROM model_project_days mpd
JOIN models m ON m.id = mpd.model_id
JOIN projects p ON p.id = mpd.project_id
JOIN project_dates pd ON pd.project_id = mpd.project_id
LEFT JOIN clients c ON c.id = p.client_id
LEFT JOIN brands b ON b.id = p.brand_id
-- Joineamos projects_models para verificar client_selection
JOIN projects_models pm ON pm.project_id = p.id AND pm.model_id = mpd.model_id
WHERE 
    -- Solo modelos APROBADOS
    pm.client_selection = 'approved'
    -- Solo proyectos ya COMPLETADOS (última fecha < ahora)
    AND pd.last_project_date < NOW();

-- Comentario para referencia
COMMENT ON VIEW finance_summary IS 'Vista consolidada de finanzas v2: Solo modelos aprobados de proyectos completados, agrupados por modelo+proyecto';
