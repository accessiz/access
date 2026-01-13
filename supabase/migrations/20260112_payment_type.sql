-- ============================================
-- Migración: Tipo de Pago (Efectivo vs Canje)
-- Fecha: 2026-01-12
-- ============================================

-- 1. Agregar columnas a model_assignments (pagos a modelos)
ALTER TABLE model_assignments 
ADD COLUMN IF NOT EXISTS payment_type TEXT DEFAULT 'cash' CHECK (payment_type IN ('cash', 'trade', 'mixed'));

ALTER TABLE model_assignments 
ADD COLUMN IF NOT EXISTS trade_description TEXT;

-- 2. Agregar columnas a projects (cobros a clientes)
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS client_payment_type TEXT DEFAULT 'cash' CHECK (client_payment_type IN ('cash', 'trade', 'mixed'));

ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS client_trade_description TEXT;

-- 3. Actualizar la vista finance_summary para incluir payment_type
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
    ma.trade_description,
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
    ma.trade_description,
    p.user_id;
