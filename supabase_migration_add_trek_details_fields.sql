-- Add new trek details fields to packages table
ALTER TABLE packages
ADD COLUMN IF NOT EXISTS departure_and_return_location TEXT,
ADD COLUMN IF NOT EXISTS departure_time TEXT,
ADD COLUMN IF NOT EXISTS trek_length TEXT,
ADD COLUMN IF NOT EXISTS base_camp TEXT;

-- Add comments to the columns
COMMENT ON COLUMN packages.departure_and_return_location IS 'Departure and return location for the trek';
COMMENT ON COLUMN packages.departure_time IS 'Departure time for the trek';
COMMENT ON COLUMN packages.trek_length IS 'Length of the trek';
COMMENT ON COLUMN packages.base_camp IS 'Base camp location for the trek';