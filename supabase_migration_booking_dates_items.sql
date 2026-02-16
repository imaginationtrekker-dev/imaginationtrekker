-- Add booking_dates_items as JSONB array (replaces single booking_dates_content)
-- Structure: [{ "heading": "March 15-20", "description": "<p>...</p>" }, ...]
ALTER TABLE packages
ADD COLUMN IF NOT EXISTS booking_dates_items JSONB DEFAULT '[]'::jsonb;

COMMENT ON COLUMN packages.booking_dates_items IS 'Array of {heading, description} for Booking Dates accordion items';
