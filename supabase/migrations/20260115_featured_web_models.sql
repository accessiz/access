-- Table for storing featured models on the public website
-- Maximum 8 models can be featured at a time

CREATE TABLE featured_web_models (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  model_id uuid NOT NULL REFERENCES models(id) ON DELETE CASCADE,
  position smallint NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE(model_id)
);

-- Create index for ordering
CREATE INDEX idx_featured_web_models_position ON featured_web_models(position);

-- Enable RLS
ALTER TABLE featured_web_models ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users full access
CREATE POLICY "authenticated_full_access" ON featured_web_models
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Allow public read access for external website API
CREATE POLICY "public_read" ON featured_web_models
  FOR SELECT TO anon USING (true);
