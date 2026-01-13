-- Add trade_fee columns to support Mixed payment type (Cash + Trade Value)

ALTER TABLE projects ADD COLUMN IF NOT EXISTS default_model_trade_fee DECIMAL(10,2);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS client_trade_revenue DECIMAL(10,2);

ALTER TABLE model_assignments ADD COLUMN IF NOT EXISTS trade_fee DECIMAL(10,2);
