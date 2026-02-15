-- General offer banners table: site-wide promotional banners shown in marquee on home page
-- Not package-specific - these are general site offers/promotions

CREATE TABLE IF NOT EXISTS offer_banners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  image_url TEXT NOT NULL,
  alt_title TEXT,
  sort_order SMALLINT NOT NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index for fast lookup by active status and sort order
CREATE INDEX IF NOT EXISTS idx_offer_banners_active_sort
  ON offer_banners(is_active, sort_order);

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS offer_banners_updated_at ON offer_banners;
CREATE TRIGGER offer_banners_updated_at
  BEFORE UPDATE ON offer_banners
  FOR EACH ROW EXECUTE PROCEDURE set_updated_at();

COMMENT ON TABLE offer_banners IS 'General site-wide offer/promo banners displayed in marquee on home page';
COMMENT ON COLUMN offer_banners.image_url IS 'URL of the banner image';
COMMENT ON COLUMN offer_banners.alt_title IS 'Alt text / title tag for the banner';
COMMENT ON COLUMN offer_banners.sort_order IS 'Display order (lower numbers appear first)';
COMMENT ON COLUMN offer_banners.is_active IS 'Whether the banner is currently active/visible';

-- Enable Row Level Security
ALTER TABLE offer_banners ENABLE ROW LEVEL SECURITY;

-- Policy: Allow anonymous/public read access to active banners
CREATE POLICY "Allow public read access to active offer banners"
  ON offer_banners
  FOR SELECT
  USING (is_active = true);

-- Policy: Allow authenticated users to manage banners (for dashboard)
CREATE POLICY "Allow authenticated users to manage offer banners"
  ON offer_banners
  FOR ALL
  USING (auth.role() = 'authenticated');
