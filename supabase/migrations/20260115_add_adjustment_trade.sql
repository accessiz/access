-- Add adjustment_amount_trade column for separate trade adjustments
ALTER TABLE model_assignments 
ADD COLUMN IF NOT EXISTS adjustment_amount_trade NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS adjustment_reason_trade TEXT;

COMMENT ON COLUMN model_assignments.adjustment_amount_trade IS 'Adjustment amount for trade payments (bonus if positive, deduction if negative)';
COMMENT ON COLUMN model_assignments.adjustment_reason_trade IS 'Reason for the trade adjustment';
