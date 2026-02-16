-- Add booking_dates_content column for rich text (accordion) format
ALTER TABLE packages
ADD COLUMN IF NOT EXISTS booking_dates_content TEXT;

COMMENT ON COLUMN packages.booking_dates_content IS 'Rich text content for Booking Dates section (HTML, rendered as accordion)';
