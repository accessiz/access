-- ============================================
-- Migración: Refinar Tipos de Pago (Categorías y Detalles)
-- Fecha: 2026-01-13
-- ============================================

-- 1. Actualizar PROJECTS: Agregar categorías y renombrar descripciones

-- Default Model Payment
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS default_model_trade_category TEXT CHECK (default_model_trade_category IN ('products', 'clothing', 'voucher', 'services', 'hospitality', 'other'));

-- Intentar renombrar la columna si existe con el nombre anterior
DO $$
BEGIN
  IF EXISTS(SELECT * FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'default_model_trade_description') THEN
    ALTER TABLE projects RENAME COLUMN default_model_trade_description TO default_model_trade_details;
  END IF;
END $$;

-- Si no existía la anterior ni la nueva, crear la nueva
ALTER TABLE projects ADD COLUMN IF NOT EXISTS default_model_trade_details TEXT;


-- Client Payment
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS client_trade_category TEXT CHECK (client_trade_category IN ('products', 'clothing', 'voucher', 'services', 'hospitality', 'other'));

DO $$
BEGIN
  IF EXISTS(SELECT * FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'client_trade_description') THEN
    ALTER TABLE projects RENAME COLUMN client_trade_description TO client_trade_details;
  END IF;
END $$;

ALTER TABLE projects ADD COLUMN IF NOT EXISTS client_trade_details TEXT;


-- 2. Actualizar MODEL_ASSIGNMENTS

ALTER TABLE model_assignments 
ADD COLUMN IF NOT EXISTS trade_category TEXT CHECK (trade_category IN ('products', 'clothing', 'voucher', 'services', 'hospitality', 'other'));

DO $$
BEGIN
  IF EXISTS(SELECT * FROM information_schema.columns WHERE table_name = 'model_assignments' AND column_name = 'trade_description') THEN
    ALTER TABLE model_assignments RENAME COLUMN trade_description TO trade_details;
  END IF;
END $$;

ALTER TABLE model_assignments ADD COLUMN IF NOT EXISTS trade_details TEXT;


-- 3. Actualizar Vista FINANCE_SUMMARY
-- Necesitamos recrear la vista para usar los nuevos nombres de columnas

DROP VIEW IF EXISTS finance_summary;

CREATE VIEW finance_summary AS
SELECT 
    ma.id,
    m.id AS model_id,
    m.full_name AS model_name,
    m.alias AS model_alias,
    p.id AS project_id,
    p.project_name,
    p.client_name,
    c.name AS registered_client_name,
    b.name AS brand_name,
    COUNT(DISTINCT ps.id) AS days_worked,
    COALESCE(pm.agreed_fee, p.default_model_fee, 0) AS daily_fee,
    COUNT(DISTINCT ps.id) * COALESCE(pm.agreed_fee, p.default_model_fee, 0) AS total_amount,
    MIN(ps.start_time) AS first_work_date,
    MAX(ps.start_time) AS last_work_date,
    COALESCE(pm.currency, p.currency, 'GTQ') AS currency,
    COALESCE(ma.payment_status, 'pending') AS payment_status,
    ma.payment_date,
    ma.payment_type,
    ma.trade_category,
    ma.trade_details,
    CASE 
        WHEN ma.payment_status = 'paid' THEN COUNT(DISTINCT ps.id) * COALESCE(pm.agreed_fee, p.default_model_fee, 0)
        ELSE 0
    END AS total_paid,
    CASE 
        WHEN ma.payment_status = 'paid' THEN 0
        ELSE COUNT(DISTINCT ps.id) * COALESCE(pm.agreed_fee, p.default_model_fee, 0)
    END AS pending_amount,
    p.user_id
FROM model_assignments ma
JOIN project_schedule ps ON ma.schedule_id = ps.id
JOIN projects p ON ps.project_id = p.id
JOIN models m ON ma.model_id = m.id
LEFT JOIN projects_models pm ON pm.project_id = p.id AND pm.model_id = m.id
LEFT JOIN clients c ON p.client_id = c.id
LEFT JOIN brands b ON p.brand_id = b.id
WHERE pm.client_selection = 'approved'
  AND p.status = 'completed'
GROUP BY 
    ma.id,
    m.id, 
    m.full_name, 
    m.alias,
    p.id, 
    p.project_name, 
    p.client_name,
    c.name,
    b.name,
    pm.agreed_fee, 
    p.default_model_fee,
    pm.currency,
    p.currency,
    ma.payment_status,
    ma.payment_date,
    ma.payment_type,
    ma.trade_category,
    ma.trade_details,
    p.user_id;
