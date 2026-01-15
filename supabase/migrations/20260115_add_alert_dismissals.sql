-- Migration: Add alert_dismissals table for snooze functionality
-- Date: 2026-01-15
-- Description: Allows users to temporarily dismiss alerts for 24 hours

-- Create alert_dismissals table
CREATE TABLE IF NOT EXISTS alert_dismissals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    alert_id TEXT NOT NULL,  -- ID of the alert (format: type_entityId, e.g., "payment_abc123")
    dismissed_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '24 hours'),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_alert_dismissals_user_id ON alert_dismissals(user_id);
CREATE INDEX IF NOT EXISTS idx_alert_dismissals_expires_at ON alert_dismissals(expires_at);
CREATE INDEX IF NOT EXISTS idx_alert_dismissals_alert_id ON alert_dismissals(alert_id);

-- Unique constraint to prevent duplicate dismissals
CREATE UNIQUE INDEX IF NOT EXISTS idx_alert_dismissals_unique 
    ON alert_dismissals(user_id, alert_id);

-- Enable RLS
ALTER TABLE alert_dismissals ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can only see their own dismissals
CREATE POLICY "Users can view own dismissals"
    ON alert_dismissals FOR SELECT
    USING (auth.uid() = user_id);

-- Users can insert their own dismissals
CREATE POLICY "Users can insert own dismissals"
    ON alert_dismissals FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can delete their own dismissals
CREATE POLICY "Users can delete own dismissals"
    ON alert_dismissals FOR DELETE
    USING (auth.uid() = user_id);

-- Users can update their own dismissals (for extending snooze)
CREATE POLICY "Users can update own dismissals"
    ON alert_dismissals FOR UPDATE
    USING (auth.uid() = user_id);

-- Add comment for documentation
COMMENT ON TABLE alert_dismissals IS 'Stores temporary alert dismissals (snooze) that expire after 24 hours';
