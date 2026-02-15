-- Banner marquee text items: text labels with links shown in the banner marquee
-- Each row: one text item with optional link, displayed in the scrolling marquee

CREATE TABLE IF NOT EXISTS banner_marquee_texts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  text TEXT NOT NULL,
  link_url TEXT,
  sort_order SMALLINT NOT NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index for fast lookup by active status and sort order
CREATE INDEX IF NOT EXISTS idx_banner_marquee_texts_active_sort
  ON banner_marquee_texts(is_active, sort_order);

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS banner_marquee_texts_updated_at ON banner_marquee_texts;
CREATE TRIGGER banner_marquee_texts_updated_at
  BEFORE UPDATE ON banner_marquee_texts
  FOR EACH ROW EXECUTE PROCEDURE set_updated_at();

COMMENT ON TABLE banner_marquee_texts IS 'Text items displayed in the banner marquee with optional links';
COMMENT ON COLUMN banner_marquee_texts.text IS 'The text to display in the marquee';
COMMENT ON COLUMN banner_marquee_texts.link_url IS 'Optional URL to link the text to';
COMMENT ON COLUMN banner_marquee_texts.sort_order IS 'Display order (lower numbers appear first)';
COMMENT ON COLUMN banner_marquee_texts.is_active IS 'Whether the text item is currently active/visible';

-- Enable Row Level Security
ALTER TABLE banner_marquee_texts ENABLE ROW LEVEL SECURITY;

-- Policy: Allow anonymous/public read access to active texts
CREATE POLICY "Allow public read access to active banner marquee texts"
  ON banner_marquee_texts
  FOR SELECT
  USING (is_active = true);

-- Policy: Allow authenticated users to manage texts (for dashboard)
CREATE POLICY "Allow authenticated users to manage banner marquee texts"
  ON banner_marquee_texts
  FOR ALL
  USING (auth.role() = 'authenticated');
