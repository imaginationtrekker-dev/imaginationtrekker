-- Create about_page table for dynamic About/FAQ page content
CREATE TABLE IF NOT EXISTS about_page (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  about_description TEXT,
  our_mission TEXT,
  our_vision TEXT,
  why_choose_us JSONB DEFAULT '[]'::jsonb, -- Array of {icon: string, title: string, description: string}
  appreciation_letter TEXT, -- Rich text content from TipTap editor
  recognition_association_letter TEXT, -- Rich text content from TipTap editor for Recognition & Association Letter
  team_members JSONB DEFAULT '[]'::jsonb, -- Array of {image_url: string, name: string, description: string, position: string}
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on updated_at for faster queries
CREATE INDEX IF NOT EXISTS idx_about_page_updated_at ON about_page(updated_at);

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS update_about_page_updated_at ON about_page;
CREATE TRIGGER update_about_page_updated_at
  BEFORE UPDATE ON about_page
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE about_page ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Allow public read access
DROP POLICY IF EXISTS "Allow public read access" ON about_page;
CREATE POLICY "Allow public read access"
  ON about_page
  FOR SELECT
  USING (true);

-- Allow authenticated users to manage about page
DROP POLICY IF EXISTS "Allow authenticated users to manage about page" ON about_page;
CREATE POLICY "Allow authenticated users to manage about page"
  ON about_page
  FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- Insert initial row (only one row should exist)
INSERT INTO about_page (about_description, our_mission, our_vision, why_choose_us, appreciation_letter, recognition_association_letter, team_members)
SELECT 
  '',
  '',
  '',
  '[]'::jsonb,
  '',
  '',
  '[]'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM about_page LIMIT 1);

-- Add comment to table
COMMENT ON TABLE about_page IS 'Dynamic About/FAQ page content';
COMMENT ON COLUMN about_page.why_choose_us IS 'JSONB array of objects with icon, title, description';
COMMENT ON COLUMN about_page.team_members IS 'JSONB array of objects with image_url, name, description, position';
COMMENT ON COLUMN about_page.appreciation_letter IS 'Rich text HTML content from TipTap editor';
COMMENT ON COLUMN about_page.recognition_association_letter IS 'Rich text HTML content from TipTap editor for Recognition & Association Letter';
