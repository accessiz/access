-- Add trade_fee to projects_models to allow per-model trade overrides and caching
ALTER TABLE projects_models ADD COLUMN IF NOT EXISTS trade_fee DECIMAL(10,2);

-- Update finance_summary view to include trade_fee logic
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
    -- Daily Fee (Cash) logic: Use agreed_fee from middle table, fallback to project default
    COALESCE(pm.agreed_fee, p.default_model_fee, 0) AS daily_fee,
    -- Total Amount (Cash)
    COUNT(DISTINCT ps.id) * COALESCE(pm.agreed_fee, p.default_model_fee, 0) AS total_amount,
    -- Trade Fee Logic: Use trade_fee from middle table, fallback to project default trade value
    COALESCE(pm.trade_fee, p.default_model_trade_fee, 0) AS daily_trade_fee,
    -- Total Trade Value
    COUNT(DISTINCT ps.id) * COALESCE(pm.trade_fee, p.default_model_trade_fee, 0) AS total_trade_value,
    
    MIN(ps.start_time) AS first_work_date,
    MAX(ps.start_time) AS last_work_date,
    COALESCE(pm.currency, p.currency, 'GTQ') AS currency,
    COALESCE(ma.payment_status, 'pending') AS payment_status,
    ma.payment_date,
    ma.payment_type,
    ma.trade_category,
    ma.trade_details,
    -- Total Paid (Cash) logic
    CASE 
        WHEN ma.payment_status = 'paid' THEN COUNT(DISTINCT ps.id) * COALESCE(pm.agreed_fee, p.default_model_fee, 0)
        ELSE 0
    END AS total_paid,
    -- Pending Amount (Cash) logic
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
    pm.trade_fee, -- Include in group by
    p.default_model_fee,
    p.default_model_trade_fee, -- Include in group by
    pm.currency,
    p.currency,
    ma.payment_status,
    ma.payment_date,
    ma.payment_type,
    ma.trade_category,
    ma.trade_details,
    p.user_id;
