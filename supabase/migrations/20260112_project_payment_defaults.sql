-- ============================================
-- Migración: Defaults de Pago en Proyectos
-- Fecha: 2026-01-12
-- ============================================

-- Agregar columnas para configurar el pago por defecto a modelos en el proyecto
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS default_model_payment_type TEXT DEFAULT 'cash' CHECK (default_model_payment_type IN ('cash', 'trade', 'mixed'));

ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS default_model_trade_description TEXT;

-- (Opcional) Actualizar la vista finance_summary si fuera necesario leer estos defaults, 
-- pero por ahora solo se usan al momento de crear asignaciones, no para reportes históricos de asignaciones ya creadas.
