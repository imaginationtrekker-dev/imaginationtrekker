-- Recognitions table: logos/images of recognitions shown on home page before footer
CREATE TABLE IF NOT EXISTS recognitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  image_url TEXT NOT NULL,
  cloudinary_public_id TEXT,
  title TEXT NOT NULL,
  link_url TEXT,
  sort_order SMALLINT NOT NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index for fast lookup
CREATE INDEX IF NOT EXISTS idx_recognitions_active_sort
  ON recognitions(is_active, sort_order);

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS recognitions_updated_at ON recognitions;
CREATE TRIGGER recognitions_updated_at
  BEFORE UPDATE ON recognitions
  FOR EACH ROW EXECUTE PROCEDURE set_updated_at();

COMMENT ON TABLE recognitions IS 'Recognition logos/images displayed on home page';
COMMENT ON COLUMN recognitions.image_url IS 'URL of the recognition logo/image stored in Cloudinary';
COMMENT ON COLUMN recognitions.cloudinary_public_id IS 'Public ID in Cloudinary for deletion';
COMMENT ON COLUMN recognitions.title IS 'Name/title of the recognition';
COMMENT ON COLUMN recognitions.link_url IS 'Optional link when clicked';
COMMENT ON COLUMN recognitions.sort_order IS 'Display order (lower numbers appear first)';
COMMENT ON COLUMN recognitions.is_active IS 'Whether visible on the site';

-- Enable Row Level Security
ALTER TABLE recognitions ENABLE ROW LEVEL SECURITY;

-- Policy: Allow anonymous/public read access to active recognitions
CREATE POLICY "Allow public read access to active recognitions"
  ON recognitions
  FOR SELECT
  USING (is_active = true);

-- Policy: Allow authenticated users to manage recognitions (for dashboard)
CREATE POLICY "Allow authenticated users to manage recognitions"
  ON recognitions
  FOR ALL
  USING (auth.role() = 'authenticated');
