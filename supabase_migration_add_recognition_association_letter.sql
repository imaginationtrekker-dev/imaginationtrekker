-- Add recognition_association_letter column to about_page table
-- This migration adds the new field for Recognition & Association Letter section

-- Add the column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'about_page' 
    AND column_name = 'recognition_association_letter'
  ) THEN
    ALTER TABLE about_page 
    ADD COLUMN recognition_association_letter TEXT;
    
    -- Add comment
    COMMENT ON COLUMN about_page.recognition_association_letter IS 'Rich text HTML content from TipTap editor for Recognition & Association Letter';
  END IF;
END $$;

-- Update existing rows to have empty string if null
UPDATE about_page 
SET recognition_association_letter = '' 
WHERE recognition_association_letter IS NULL;
