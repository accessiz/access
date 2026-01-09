-- =====================================================
-- MÓDULO DE FINANZAS: Campos de Facturación a Clientes
-- =====================================================
-- Migración: 20260108_client_billing_fields.sql
-- Descripción: Agrega campos para gestionar cobros a clientes
-- Nota: El campo 'revenue' ya existe y se usa como subtotal
-- Fecha: 2026-01-08
-- =====================================================

-- 1. Agregar campos de facturación a la tabla projects
-- (revenue ya existe, solo agregamos los nuevos)
ALTER TABLE projects ADD COLUMN IF NOT EXISTS tax_percentage NUMERIC DEFAULT 12;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS client_payment_status TEXT DEFAULT 'pending';
ALTER TABLE projects ADD COLUMN IF NOT EXISTS client_payment_date TIMESTAMPTZ;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS invoice_number TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS invoice_date DATE;

-- 2. Agregar comentarios para documentación
COMMENT ON COLUMN projects.revenue IS 'Monto total a cobrar al cliente (subtotal antes de impuestos)';
COMMENT ON COLUMN projects.tax_percentage IS 'Porcentaje de impuesto/IVA aplicable (0, 5, 8, 10, 12, 15, 18, etc.)';
COMMENT ON COLUMN projects.client_payment_status IS 'Estado del pago del cliente: pending, invoiced, paid';
COMMENT ON COLUMN projects.client_payment_date IS 'Fecha en que el cliente realizó el pago';
COMMENT ON COLUMN projects.invoice_number IS 'Número de factura emitida al cliente (opcional)';
COMMENT ON COLUMN projects.invoice_date IS 'Fecha de emisión de la factura';

-- 3. Crear vista consolidada de facturación a clientes
CREATE OR REPLACE VIEW client_billing_summary AS
SELECT 
    p.id as project_id,
    p.project_name,
    p.client_name,
    c.name as registered_client_name,
    b.name as brand_name,
    p.status as project_status,
    -- Fechas del proyecto
    (SELECT MIN(start_time)::date FROM project_schedule WHERE project_id = p.id) as first_work_date,
    (SELECT MAX(end_time)::date FROM project_schedule WHERE project_id = p.id) as last_work_date,
    -- Montos de facturación
    COALESCE(p.revenue, 0) as subtotal,
    COALESCE(p.tax_percentage, 12) as tax_percentage,
    ROUND(COALESCE(p.revenue, 0) * COALESCE(p.tax_percentage, 12) / 100, 2) as tax_amount,
    ROUND(COALESCE(p.revenue, 0) * (1 + COALESCE(p.tax_percentage, 12) / 100), 2) as total_with_tax,
    p.currency,
    -- Estado de pago
    COALESCE(p.client_payment_status, 'pending') as payment_status,
    p.client_payment_date as payment_date,
    p.invoice_number,
    p.invoice_date,
    -- Costos de modelos (para calcular margen)
    COALESCE((
        SELECT SUM(
            COALESCE(ma.daily_fee, pm.agreed_fee, p.default_model_fee, 0)
        )
        FROM projects_models pm
        JOIN model_assignments ma ON ma.model_id = pm.model_id
        JOIN project_schedule ps ON ps.id = ma.schedule_id AND ps.project_id = p.id
        WHERE pm.project_id = p.id
        AND pm.client_selection = 'approved'
    ), 0) as total_model_costs,
    -- Margen bruto
    ROUND(
        COALESCE(p.revenue, 0) - COALESCE((
            SELECT SUM(COALESCE(ma.daily_fee, pm.agreed_fee, p.default_model_fee, 0))
            FROM projects_models pm
            JOIN model_assignments ma ON ma.model_id = pm.model_id
            JOIN project_schedule ps ON ps.id = ma.schedule_id AND ps.project_id = p.id
            WHERE pm.project_id = p.id
            AND pm.client_selection = 'approved'
        ), 0),
    2) as gross_margin,
    p.user_id,
    p.created_at
FROM projects p
LEFT JOIN clients c ON c.id = p.client_id
LEFT JOIN brands b ON b.id = p.brand_id
WHERE p.status != 'draft' -- Solo proyectos activos/completados
ORDER BY p.created_at DESC;

COMMENT ON VIEW client_billing_summary IS 'Vista consolidada de facturación a clientes con cálculos de IVA y margen';

-- 4. Crear índice para mejorar performance de consultas de facturación
CREATE INDEX IF NOT EXISTS idx_projects_client_payment_status ON projects(client_payment_status);
CREATE INDEX IF NOT EXISTS idx_projects_client_payment_date ON projects(client_payment_date);
