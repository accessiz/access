-- Migration: Drop portfolio_path column from models table
-- Reason: portfolio_path stored a single horizontal image that has been replaced
-- by gallery_paths (array). All code references have been removed.
-- This is a destructive migration — backup data before applying.

-- Step 1: Verify no rows have valuable data (safety check, run manually first)
-- SELECT id, alias, portfolio_path FROM models WHERE portfolio_path IS NOT NULL;

-- Step 2: Drop the column
ALTER TABLE models DROP COLUMN IF EXISTS portfolio_path;
