-- Migration: Add blur hash columns + drop portfolio_path
-- Date: 2026-03-04
-- Purpose: AAA+ image pipeline — instant blur placeholders for SmartCroppedImage

-- 1. Drop legacy portfolio_path (single horizontal image, replaced by gallery_paths)
ALTER TABLE models DROP COLUMN IF EXISTS portfolio_path;

-- 2. Add blur hash columns for instant placeholder rendering
-- These store tiny ~200-byte base64 data URIs generated server-side.
-- They are parallel arrays to cover_path, comp_card_paths, gallery_paths.
ALTER TABLE models ADD COLUMN IF NOT EXISTS cover_blur_hash text;
ALTER TABLE models ADD COLUMN IF NOT EXISTS comp_card_blur_hashes text[];
ALTER TABLE models ADD COLUMN IF NOT EXISTS gallery_blur_hashes text[];

COMMENT ON COLUMN models.cover_blur_hash IS 'Base64 tiny blur placeholder for cover image (data URI ~200 bytes)';
COMMENT ON COLUMN models.comp_card_blur_hashes IS 'Base64 tiny blur placeholders for comp card slots (parallel array)';
COMMENT ON COLUMN models.gallery_blur_hashes IS 'Base64 tiny blur placeholders for gallery images (parallel array)';
