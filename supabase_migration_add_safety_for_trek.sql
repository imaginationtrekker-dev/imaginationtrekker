-- Add safety_for_trek column to packages table
ALTER TABLE packages
ADD COLUMN IF NOT EXISTS safety_for_trek TEXT;

-- Add comment to the column
COMMENT ON COLUMN packages.safety_for_trek IS 'Safety information for the trek';
