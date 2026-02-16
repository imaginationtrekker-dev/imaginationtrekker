-- Add link_url column to offer_banners table
ALTER TABLE offer_banners
ADD COLUMN IF NOT EXISTS link_url TEXT;

COMMENT ON COLUMN offer_banners.link_url IS 'Optional URL the banner links to when clicked';
