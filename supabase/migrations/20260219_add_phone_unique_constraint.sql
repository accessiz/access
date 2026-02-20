-- Add UNIQUE constraint to phone_e164 to prevent duplicate phone numbers
-- Note: Marcelo Mendoza (9db9531f) had a duplicate phone set to NULL before this migration
ALTER TABLE models ADD CONSTRAINT models_phone_e164_key UNIQUE (phone_e164);
