-- Migration: Add image path columns to models table
-- Run this in Supabase SQL editor or via psql
ALTER TABLE public.models
  ADD COLUMN IF NOT EXISTS cover_path text NULL,
  ADD COLUMN IF NOT EXISTS portfolio_path text NULL,
  ADD COLUMN IF NOT EXISTS comp_card_paths text[] NULL;

-- Optional: create index on cover_path if you query by it frequently
CREATE INDEX IF NOT EXISTS idx_models_cover_path ON public.models USING btree (cover_path);
